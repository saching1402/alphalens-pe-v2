import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getManagers } from '../lib/api'

const fmt = (v, s='%') => v != null ? (+v).toFixed(1)+s : '—'
const fmtB = v => v ? (v >= 1000 ? '$'+(v/1000).toFixed(1)+'B' : '$'+v.toFixed(0)+'M') : '—'
const irrCls = v => v == null ? 'na mono' : +v >= 25 ? 'g mono' : +v >= 12 ? 'a mono' : 'r mono'

export default function Managers() {
  const [search, setSearch] = useState('')
  const [strategy, setStrategy] = useState('')
  const [selected, setSelected] = useState(null)

  const { data: managers = [], isLoading } = useQuery({ queryKey: ['managers', search, strategy], queryFn: () => getManagers({ search, strategy }) })

  return (
    <div>
      <div className="page-title">Fund Managers</div>
      <div className="page-sub">{managers.length} managers — click a row to see funds</div>
      <div className="filter-bar">
        <input placeholder="Search managers…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        <select value={strategy} onChange={e => setStrategy(e.target.value)} style={{ width: 160 }}>
          <option value="">All Strategies</option>
          <option value="MM">Mid-Market</option>
          <option value="LMM">Lower Mid-Market</option>
        </select>
        {selected && <button className="btn btn-ghost" onClick={() => setSelected(null)}>✕ Close detail</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 480px' : '1fr', gap: 20 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Manager</th><th>Strategy</th><th>AUM</th><th>Funds</th><th>Avg IRR</th><th>Avg TVPI</th><th>Avg DPI</th><th>PB Score</th><th>Top Q</th></tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Loading…</td></tr>
                  : managers.map(m => (
                    <tr key={m.id} onClick={() => setSelected(m === selected ? null : m)} style={{ cursor: 'pointer', background: selected?.id === m.id ? 'rgba(201,168,76,.05)' : '' }}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>{m.strategy && <span className={`badge badge-${m.strategy.toLowerCase()}`}>{m.strategy}</span>}</td>
                      <td className="mono">{fmtB(m.aum_usd_m)}</td>
                      <td className="mono">{m.fund_count}</td>
                      <td className={irrCls(m.avg_irr)}>{fmt(m.avg_irr)}</td>
                      <td className="mono">{fmt(m.avg_tvpi, 'x')}</td>
                      <td className="mono">{fmt(m.avg_dpi, 'x')}</td>
                      <td className="mono">{m.pb_score ?? '—'}</td>
                      <td className="mono g">{m.top_quartile || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        {selected && (
          <div className="card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{selected.name}</div>
            {selected.description && <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>{selected.description}</p>}
            <div className="grid grid-2" style={{ marginBottom: 16 }}>
              {[['Avg IRR', fmt(selected.avg_irr), irrCls(selected.avg_irr)], ['Avg TVPI', fmt(selected.avg_tvpi, 'x'), 'mono'], ['Avg DPI', fmt(selected.avg_dpi, 'x'), 'mono'], ['Alpha vs BM', selected.alpha != null ? (selected.alpha > 0 ? '+' : '') + fmt(selected.alpha) : '—', selected.alpha > 0 ? 'g mono' : 'r mono'], ['AUM', fmtB(selected.aum_usd_m), 'mono'], ['Top Quartile', selected.top_quartile, 'g mono']].map(([l, v, cls]) => (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }} key={l}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 4 }}>{l}</div>
                  <div className={cls} style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.7px' }}>Funds ({selected.funds?.length})</div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Fund</th><th>Vintage</th><th>IRR</th><th>TVPI</th><th>DPI</th><th>Q</th></tr></thead>
                <tbody>
                  {(selected.funds || []).map(f => (
                    <tr key={f.id}>
                      <td style={{ fontSize: 12 }}>{f.fund_name}</td>
                      <td className="mono">{f.vintage || '—'}</td>
                      <td className={irrCls(f.irr)}>{fmt(f.irr)}</td>
                      <td className="mono">{fmt(f.tvpi, 'x')}</td>
                      <td className="mono">{fmt(f.dpi, 'x')}</td>
                      <td className={`q${f.fund_quartile?.charAt(0)} mono`}>{f.fund_quartile?.charAt(0) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
