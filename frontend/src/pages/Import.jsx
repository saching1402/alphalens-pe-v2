import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { importFile } from '../lib/api'

export default function Import() {
  const qc = useQueryClient()
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const ref = useRef()

  const handle = async (file) => {
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) { toast.error('Please select an Excel file (.xlsx)'); return }
    setLoading(true); setResult(null)
    try {
      const data = await importFile(file)
      setResult(data)
      qc.invalidateQueries()
      toast.success(`Imported: ${data.managers_created} managers, ${data.funds_created} funds`)
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Import failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-title">Import Data</div>
      <div className="page-sub">Upload your PE fund manager Excel file</div>
      <div style={{ maxWidth: 600 }}>
        <div className={`drop-zone ${drag ? 'drag' : ''}`}
          onClick={() => ref.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{loading ? 'Importing…' : 'Drop Excel file here or click to browse'}</div>
          <div style={{ color: 'var(--text3)', fontSize: 12 }}>Supports .xlsx — both sheets: Fund Manager Info + Consol View Values</div>
          <input ref={ref} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
        </div>
        {result && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ color: 'var(--green)', fontWeight: 600, marginBottom: 12 }}>✓ Import Complete</div>
            {[['Managers imported', result.managers_created], ['Funds imported', result.funds_created]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text2)' }}>{l}</span>
                <span className="mono" style={{ color: 'var(--gold2)' }}>{v}</span>
              </div>
            ))}
            {result.errors?.length > 0 && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{result.errors.length} errors</div>}
          </div>
        )}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title">Expected columns</div>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 10 }}>Sheet 1 — Fund Manager Info:</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Masked Investor Name','Masked Fund Name','Fund ID','Vintage','Fund Size','IRR','TVPI','DPI','RVPI','Fund Quartile','IRR Benchmark*','As of Quarter','Preferred Geography','Preferred Industry'].map(c => (
              <span key={c} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: 'var(--teal)' }}>{c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
