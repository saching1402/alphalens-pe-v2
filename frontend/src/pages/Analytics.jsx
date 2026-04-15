import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, Scatter } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import { getTop, getScatter, getQuartile } from '../lib/api'
Chart.register(...registerables)

const COLORS = ['#c9a84c','#e8c96e','#4f9cf9','#2dd4bf','#a78bfa','#f59e0b','#22c55e','#f43f5e','#6366f1','#ec4899','#0ea5e9','#84cc16','#fb923c','#e879f9','#34d399']
const OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } }, tooltip: { backgroundColor: '#141e30', borderColor: '#1e3055', borderWidth: 1, titleColor: '#e2e8f5', bodyColor: '#94a3b8' } }, scales: { x: { ticks: { color: '#4b5e7a' }, grid: { color: '#1e3055' } }, y: { ticks: { color: '#4b5e7a' }, grid: { color: '#1e3055' } } } }
const METRICS = [{ v: 'irr', l: 'IRR (%)' }, { v: 'tvpi', l: 'TVPI (x)' }, { v: 'dpi', l: 'DPI (x)' }, { v: 'rvpi', l: 'RVPI (x)' }]

export default function Analytics() {
  const [metric, setMetric] = useState('irr')
  const [xAxis, setXAxis] = useState('irr')
  const [yAxis, setYAxis] = useState('tvpi')
  const [strategy, setStrategy] = useState('')
  const [limit, setLimit] = useState(15)

  const { data: top } = useQuery({ queryKey: ['top', metric, limit, strategy], queryFn: () => getTop({ metric, limit, strategy }) })
  const { data: scatter } = useQuery({ queryKey: ['scatter', xAxis, yAxis, strategy], queryFn: () => getScatter({ x: xAxis, y: yAxis, strategy }) })
  const { data: qDist } = useQuery({ queryKey: ['quartile', strategy], queryFn: () => getQuartile({ strategy }) })

  const barData = top ? { labels: top.map(m => m.name), datasets: [{ label: METRICS.find(m => m.v === metric)?.l, data: top.map(m => m.value), backgroundColor: COLORS, borderRadius: 4 }] } : null
  const scatterData = scatter ? { datasets: [{ label: 'Managers', data: scatter.map(p => ({ x: p.x, y: p.y, name: p.name })), backgroundColor: COLORS.map((c, i) => scatter[i]?.strategy === 'MM' ? '#4f9cf9' : '#c9a84c'), pointRadius: 6 }] } : null
  const qData = qDist ? { labels: ['Q1', 'Q2', 'Q3', 'Q4', 'N/A'], datasets: [{ data: [qDist['1']||0,qDist['2']||0,qDist['3']||0,qDist['4']||0,qDist['N/A']||0], backgroundColor: ['#22c55e','#c9a84c','#f97316','#f43f5e','#4b5e7a'], borderRadius: 4 }] } : null

  const scatterOpts = { ...OPTS, plugins: { ...OPTS.plugins, tooltip: { ...OPTS.plugins.tooltip, callbacks: { label: ctx => { const p = scatter?.[ctx.dataIndex]; return p ? `${p.name}: (${p.x}, ${p.y})` : '' } } } } }

  return (
    <div>
      <div className="page-title">Analytics</div>
      <div className="page-sub">Cross-manager performance comparison</div>
      <div className="filter-bar">
        <select value={strategy} onChange={e => setStrategy(e.target.value)} style={{ width: 160 }}>
          <option value="">All Strategies</option>
          <option value="MM">Mid-Market</option>
          <option value="LMM">Lower Mid-Market</option>
        </select>
        <select value={metric} onChange={e => setMetric(e.target.value)} style={{ width: 140 }}>
          {METRICS.map(m => <option key={m.v} value={m.v}>Bar: {m.l}</option>)}
        </select>
        <select value={xAxis} onChange={e => setXAxis(e.target.value)} style={{ width: 140 }}>
          {METRICS.map(m => <option key={m.v} value={m.v}>X: {m.l}</option>)}
        </select>
        <select value={yAxis} onChange={e => setYAxis(e.target.value)} style={{ width: 140 }}>
          {METRICS.map(m => <option key={m.v} value={m.v}>Y: {m.l}</option>)}
        </select>
        <select value={limit} onChange={e => setLimit(+e.target.value)} style={{ width: 100 }}>
          {[10,15,20,30].map(n => <option key={n} value={n}>Top {n}</option>)}
        </select>
      </div>
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">Top {limit} by {METRICS.find(m => m.v === metric)?.l}</div>
          <div className="chart-box">{barData && <Bar data={barData} options={{ ...OPTS, indexAxis: 'y', plugins: { ...OPTS.plugins, legend: { display: false } } }} />}</div>
        </div>
        <div className="card">
          <div className="section-title">{METRICS.find(m => m.v === xAxis)?.l} vs {METRICS.find(m => m.v === yAxis)?.l}</div>
          <div className="chart-box">{scatterData && <Scatter data={scatterData} options={scatterOpts} />}</div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 500 }}>
        <div className="section-title">Quartile Distribution</div>
        <div className="chart-box" style={{ height: 240 }}>{qData && <Bar data={qData} options={{ ...OPTS, plugins: { ...OPTS.plugins, legend: { display: false } } }} />}</div>
      </div>
    </div>
  )
}
