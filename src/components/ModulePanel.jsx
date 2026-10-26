import { useEffect, useState } from 'react'
import { Plus, RefreshCw, X } from 'lucide-react'
import { createAsset, getModuleConfig, listModuleRows } from '../services/data'

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (value.includes?.('T')) return new Date(value).toLocaleDateString('fr-FR')
  return String(value)
}

export default function ModulePanel({ module, onClose, onNotice }) {
  const config = getModuleConfig(module)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ sku: '', name: '', kind: 'material', unit: 'unité' })

  async function load() {
    setLoading(true); setError('')
    const result = await listModuleRows(module)
    setRows(result.rows)
    if (result.error) setError(result.error.message)
    setLoading(false)
  }

  useEffect(() => { load() }, [module])

  async function submitAsset(event) {
    event.preventDefault()
    const { error: insertError } = await createAsset({ ...form, minimum_quantity: 0, unit_cost: 0 })
    if (insertError) setError(insertError.message)
    else { setFormOpen(false); setForm({ sku: '', name: '', kind: 'material', unit: 'unité' }); onNotice('Actif créé dans Supabase'); load() }
  }

  if (!config) return null
  return <div className="module-backdrop" onClick={onClose}><section className="module-panel" onClick={(event) => event.stopPropagation()}><header className="module-header"><div><p className="eyebrow">DONNÉES SUPABASE • RLS ACTIF</p><h2>{config.title}</h2><p>Les lignes affichées proviennent directement de PostgreSQL.</p>{config.examples && <div className="module-examples">{config.examples.map((example) => <span key={example}>{example}</span>)}</div>}</div><div className="module-actions"><button className="icon-button" onClick={load} aria-label="Actualiser"><RefreshCw size={17} /></button>{module === 'Stocks & inventaires' && <button className="primary-button" onClick={() => setFormOpen(true)}><Plus size={16} />Nouvel actif</button>}<button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={19} /></button></div></header>{formOpen && <form className="asset-form" onSubmit={submitAsset}><input required placeholder="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /><input required placeholder="Nom de l'actif" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}><option value="material">Matériau</option><option value="consumable">Consommable</option><option value="tool">Outil</option><option value="equipment">Équipement</option><option value="machine">Engin</option></select><input required placeholder="Unité" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /><button className="primary-button">Enregistrer</button></form>}{error && <div className="module-error">Impossible de charger ce module : {error}. Vérifiez que la migration Supabase est appliquée et que la politique RLS autorise votre utilisateur.</div>}{loading ? <div className="module-empty">Chargement des données...</div> : rows.length === 0 ? <div className="module-empty">Aucune donnée dans cette table pour votre organisation.</div> : <div className="table-wrap"><table><thead><tr>{config.columns.map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.columns.map((column) => <td key={column}>{formatValue(row[column])}</td>)}</tr>)}</tbody></table></div>}</section></div>
}
