from django.db.models import Avg, Count, Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import FundManager, Fund
import pandas as pd
from decimal import Decimal, InvalidOperation


def f(v):
    if v is None: return None
    try: return round(float(v), 4)
    except: return None


def enrich_manager(m):
    funds = list(m.funds.all())
    irrs = [f(x.irr) for x in funds if x.irr is not None]
    tvpis = [f(x.tvpi) for x in funds if x.tvpi is not None]
    dpis = [f(x.dpi) for x in funds if x.dpi is not None]
    rvpis = [f(x.rvpi) for x in funds if x.rvpi is not None]
    sizes = [f(x.fund_size_usd_m) for x in funds if x.fund_size_usd_m is not None]
    irr_b = [f(x.irr_benchmark) for x in funds if x.irr_benchmark is not None]
    avg = lambda lst: round(sum(lst)/len(lst), 3) if lst else None
    w_avg = lambda vals, wts: round(sum(v*w for v,w in zip(vals,wts))/sum(wts), 3) if vals and wts else None
    qmap = {}
    for x in funds:
        if x.fund_quartile:
            q = x.fund_quartile[:1]
            qmap[q] = qmap.get(q, 0) + 1
    return {
        'id': str(m.id), 'name': m.name, 'strategy': m.strategy,
        'pb_score': f(m.pb_score), 'aum_usd_m': f(m.aum_usd_m),
        'description': m.description, 'year_found': m.year_found,
        'latest_fund_size_usd_m': f(m.latest_fund_size_usd_m),
        'fund_count': len(funds),
        'avg_irr': avg(irrs), 'avg_tvpi': avg(tvpis), 'avg_dpi': avg(dpis), 'avg_rvpi': avg(rvpis),
        'avg_fund_size': avg(sizes),
        'size_weighted_irr': w_avg(irrs, sizes[:len(irrs)]) if len(irrs)==len(sizes) else None,
        'avg_irr_benchmark': avg(irr_b),
        'alpha': round(avg(irrs)-avg(irr_b), 3) if avg(irrs) and avg(irr_b) else None,
        'top_quartile': qmap.get('1', 0),
        'funds': [{'id': str(x.id), 'fund_id': x.fund_id, 'fund_name': x.fund_name,
                   'vintage': x.vintage, 'fund_size_usd_m': f(x.fund_size_usd_m),
                   'fund_type': x.fund_type, 'investments': x.investments,
                   'irr': f(x.irr), 'tvpi': f(x.tvpi), 'dpi': f(x.dpi), 'rvpi': f(x.rvpi),
                   'fund_quartile': x.fund_quartile, 'irr_benchmark': f(x.irr_benchmark),
                   'tvpi_benchmark': f(x.tvpi_benchmark), 'dpi_benchmark': f(x.dpi_benchmark),
                   'as_of_quarter': x.as_of_quarter, 'as_of_year': x.as_of_year,
                   'geography': x.geography, 'industry': x.industry} for x in funds]
    }


@api_view(['GET'])
def dashboard(request):
    managers = FundManager.objects.prefetch_related('funds').all()
    all_irr, all_tvpi, all_dpi, top_q = [], [], [], 0
    for m in managers:
        for x in m.funds.all():
            if x.irr: all_irr.append(float(x.irr))
            if x.tvpi: all_tvpi.append(float(x.tvpi))
            if x.dpi: all_dpi.append(float(x.dpi))
            if x.fund_quartile and x.fund_quartile.startswith('1'): top_q += 1
    avg = lambda l: round(sum(l)/len(l), 3) if l else None
    return Response({
        'manager_count': managers.count(),
        'fund_count': Fund.objects.count(),
        'total_aum': round(sum(float(m.aum_usd_m) for m in managers if m.aum_usd_m), 0),
        'avg_irr': avg(all_irr), 'avg_tvpi': avg(all_tvpi), 'avg_dpi': avg(all_dpi),
        'top_quartile_count': top_q,
        'top_quartile_pct': round(top_q/Fund.objects.count()*100, 1) if Fund.objects.count() else 0,
    })


@api_view(['GET'])
def managers_list(request):
    qs = FundManager.objects.prefetch_related('funds').all()
    search = request.GET.get('search', '')
    strategy = request.GET.get('strategy', '')
    if search: qs = qs.filter(name__icontains=search)
    if strategy: qs = qs.filter(strategy=strategy)
    return Response([enrich_manager(m) for m in qs])


@api_view(['GET', 'PATCH'])
def manager_detail(request, pk):
    try: m = FundManager.objects.prefetch_related('funds').get(pk=pk)
    except FundManager.DoesNotExist: return Response({'error': 'not found'}, status=404)
    if request.method == 'PATCH':
        for k, v in request.data.items():
            if hasattr(m, k): setattr(m, k, v)
        m.save()
    return Response(enrich_manager(m))


@api_view(['GET'])
def top_managers(request):
    metric = request.GET.get('metric', 'irr')
    limit = int(request.GET.get('limit', 15))
    strategy = request.GET.get('strategy', '')
    qs = FundManager.objects.prefetch_related('funds').all()
    if strategy: qs = qs.filter(strategy=strategy)
    result = []
    for m in qs:
        funds = list(m.funds.all())
        vals = [float(getattr(x, metric)) for x in funds if getattr(x, metric) is not None]
        if vals:
            result.append({'name': m.name, 'value': round(sum(vals)/len(vals), 3), 'strategy': m.strategy, 'fund_count': len(funds)})
    result.sort(key=lambda x: x['value'], reverse=True)
    return Response(result[:limit])


@api_view(['GET'])
def scatter(request):
    x_field = request.GET.get('x', 'irr')
    y_field = request.GET.get('y', 'tvpi')
    strategy = request.GET.get('strategy', '')
    ALLOWED = {'irr', 'tvpi', 'dpi', 'rvpi', 'fund_size_usd_m'}
    if x_field not in ALLOWED or y_field not in ALLOWED:
        return Response({'error': 'invalid field'}, status=400)
    qs = FundManager.objects.prefetch_related('funds').all()
    if strategy: qs = qs.filter(strategy=strategy)
    result = []
    for m in qs:
        funds = list(m.funds.all())
        xv = [float(getattr(f, x_field)) for f in funds if getattr(f, x_field) is not None]
        yv = [float(getattr(f, y_field)) for f in funds if getattr(f, y_field) is not None]
        if xv and yv:
            result.append({'name': m.name, 'x': round(sum(xv)/len(xv),3), 'y': round(sum(yv)/len(yv),3),
                           'strategy': m.strategy, 'fund_count': len(funds), 'aum': float(m.aum_usd_m) if m.aum_usd_m else None})
    return Response(result)


@api_view(['GET'])
def quartile_dist(request):
    strategy = request.GET.get('strategy', '')
    qs = Fund.objects.all()
    if strategy: qs = qs.filter(manager__strategy=strategy)
    dist = {'1': 0, '2': 0, '3': 0, '4': 0, 'N/A': 0}
    for f in qs:
        k = f.fund_quartile[:1] if f.fund_quartile else 'N/A'
        dist[k if k in dist else 'N/A'] += 1
    return Response(dist)


@api_view(['POST'])
def import_excel(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file'}, status=400)
    file = request.FILES['file']
    try:
        xf = pd.ExcelFile(file)
        result = {'managers_created': 0, 'funds_created': 0, 'errors': []}

        # Process Consol View for manager-level data
        mgr_data = {}
        consol = next((s for s in xf.sheet_names if 'consol' in s.lower()), None)
        if consol:
            dc = xf.parse(consol)
            dc.columns = [str(c).strip() for c in dc.columns]
            col_map = {'Masked Investor Name': 'name', 'Strategy': 'strategy',
                       'Pitchbook Mgr  Score': 'pb_score', 'Pitchbook Mgr Score': 'pb_score',
                       'AUM (USD M)': 'aum_usd_m', 'Description': 'description',
                       'Year Found': 'year_found', 'Segment': 'segment',
                       'Latest Fund Size (USD M)': 'latest_fund_size_usd_m'}
            dc.rename(columns=col_map, inplace=True)
            if 'name' in dc.columns:
                for _, row in dc.iterrows():
                    n = str(row.get('name', '')).strip()
                    if n and n != 'nan':
                        mgr_data[n] = {k: (None if pd.isna(v) else v) for k, v in row.items() if k != 'name'}

        # Process fund sheet
        fund_sheet = next((s for s in xf.sheet_names if 'consol' not in s.lower()), xf.sheet_names[0])
        df = xf.parse(fund_sheet)
        df.columns = [str(c).strip() for c in df.columns]
        FMAP = {'Masked Investor Name': 'mgr', 'Masked Fund Name': 'fund_name', 'Fund ID': 'fund_id',
                'Vintage': 'vintage', 'Fund Size': 'fund_size', 'Fund Type': 'fund_type',
                'Investments': 'investments', 'Total Investments': 'total_investments',
                'IRR': 'irr', 'TVPI': 'tvpi', 'RVPI': 'rvpi', 'DPI': 'dpi',
                'Fund Quartile': 'fund_quartile', 'IRR Benchmark*': 'irr_b', 'TVPI Benchmark*': 'tvpi_b',
                'DPI Benchmark*': 'dpi_b', 'As of Quarter': 'as_of_q', 'As of Year': 'as_of_y',
                'Preferred Geography': 'geography', 'Preferred Industry': 'industry'}
        df.rename(columns=FMAP, inplace=True)

        def dec(v):
            if v is None or (isinstance(v, float) and pd.isna(v)): return None
            try: return round(float(v), 4)
            except: return None
        def intv(v):
            if v is None or (isinstance(v, float) and pd.isna(v)): return None
            try: return int(float(v))
            except: return None
        def strv(v):
            if v is None or (isinstance(v, float) and pd.isna(v)): return None
            s = str(v).strip(); return s if s and s != 'nan' else None

        FundManager.objects.all().delete()
        Fund.objects.all().delete()

        mgr_cache = {}
        for _, row in df.iterrows():
            mgr_name = strv(row.get('mgr'))
            if not mgr_name: continue
            if mgr_name not in mgr_cache:
                extra = mgr_data.get(mgr_name, {})
                m = FundManager.objects.create(
                    name=mgr_name,
                    strategy=strv(extra.get('strategy')),
                    pb_score=dec(extra.get('pb_score')),
                    aum_usd_m=dec(extra.get('aum_usd_m')),
                    description=strv(extra.get('description')),
                    year_found=intv(extra.get('year_found')),
                    latest_fund_size_usd_m=dec(extra.get('latest_fund_size_usd_m')),
                )
                mgr_cache[mgr_name] = m
                result['managers_created'] += 1
            fund_name = strv(row.get('fund_name'))
            if not fund_name: continue
            Fund.objects.create(
                manager=mgr_cache[mgr_name],
                fund_id=strv(row.get('fund_id')),
                fund_name=fund_name,
                vintage=intv(row.get('vintage')),
                fund_size_usd_m=dec(row.get('fund_size')),
                fund_type=strv(row.get('fund_type')),
                investments=intv(row.get('investments')),
                total_investments=intv(row.get('total_investments')),
                irr=dec(row.get('irr')), tvpi=dec(row.get('tvpi')),
                rvpi=dec(row.get('rvpi')), dpi=dec(row.get('dpi')),
                fund_quartile=strv(row.get('fund_quartile')),
                irr_benchmark=dec(row.get('irr_b')), tvpi_benchmark=dec(row.get('tvpi_b')),
                dpi_benchmark=dec(row.get('dpi_b')),
                as_of_quarter=strv(row.get('as_of_q')), as_of_year=intv(row.get('as_of_y')),
                geography=strv(row.get('geography')), industry=strv(row.get('industry')),
            )
            result['funds_created'] += 1
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
