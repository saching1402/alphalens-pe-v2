import { useQuery } from '@tanstack/react-query'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import { getDashboard, getTop, getQuartile } from '../lib/api'
Chart.register(...registerables)

const OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } }, tooltip: { backgroundColor: '#141e30', borderColor: '#1e3055', borderWidth: 1, titleColor: '#e2e8f5', bodyColor: '#94a3b8' } }, scales: { x: { ticks: { color: '#4b5e7a' }, grid: { color: '#1e3055' } }, y: { ticks: { color: '#4b5e7a' }, grid: { color: '#1e3055' } } } }
const COLORS = ['#c9a84c','#e8c96e','#4f9cf9','#2dd4bf','#a78bfa','#f59e0b','#22c55e','#f43f5e','#6366f1','#ec4899','#0ea5e9','#84cc16','#fb923c','#e879f9','#34d399']

export default function Overview() {
  const { data: dash } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const { data: top } = useQuery({ queryKey: ['top', 'irr', 15], queryFn: () => getTop({ metric: 'irr', limit: 15 }) })
  const { data: qDist } = useQuery({ queryKey: ['quartile'], queryFn: () => getQuartile({}) })

  const fmt = (v, s='%') => v != null ? v.toFixed(1)+s : '—'
  const fmtB = v => v ? (v >= 1000 ? '$'+(v/1000).toFixed(1)+'B' : '$'+v.toFixed(0)+'M') : '—'

  const barData = top ? { labels: top.map(m => m.name), datasets: [{ label: 'Avg IRR %', data: top.map(m => m.value), backgroundColor: COLORS, borderRadius: 4 }] } : null
  const donutData = qDist ? { labels: ['Q1 Top','Q2 Upper','Q3 Lower','Q4 Bottom','N/A'], datasets: [{ data: [qDist['1']||0,qDist['2']||0,qDist['3']||0,qDist['4']||0,qDist['N/A']||0], backgroundColor: ['#22c55e','#c9a84c','#f97316','#f43f5e','#4b5e7a'], borderWidth: 0 }] } : null

  return (
    <div>
      <div className="page-title">Portfolio Overview</div>
      <div className="page-sub">Universe summary across all PE fund managers</div>
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {[['Fund Managers', dash?.manager_count, ''], ['Total Funds', dash?.fund_count, ''], ['Total AUM', fmtB(dash?.total_aum), ''], ['Universe Avg IRR', fmt(dash?.avg_irr), ''], ['Universe Avg TVPI', fmt(dash?.avg_tvpi, 'x'), ''], ['Universe Avg DPI', fmt(dash?.avg_dpi, 'x'), ''], ['Top Quartile', dash?.top_quartile_count, `${dash?.top_quartile_pct ?? 0}% of funds`]].map(([l, v, s]) => (
          <div className="stat" key={l}><div className="lbl">{l}</div><div className="val">{v ?? '—'}</div>{s && <div className="sub">{s}</div>}</div>
        ))}
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Top 15 Managers by Avg IRR</div>
          <div className="chart-box">
            {barData && <Bar data={barData} options={{ ...OPTS, indexAxis: 'y', plugins: { ...OPTS.plugins, legend: { display: false } } }} />}
          </div>
        </div>
        <div className="card">
          <div className="section-title">Fund Quartile Distribution</div>
          <div className="chart-box">
            {donutData && <Doughnut data={donutData} options={{ ...OPTS, cutout: '65%', scales: undefined }} />}
          </div>
        </div>
      </div>
    </div>
  )
}
