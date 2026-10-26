import { supabase } from './supabase'

const moduleConfig = {
  'Stocks & inventaires': { table: 'assets', title: 'Stocks & inventaires', columns: ['sku', 'name', 'kind', 'unit', 'minimum_quantity'] },
  'Achats': { table: 'purchases', title: 'Achats', columns: ['number', 'status', 'total_amount', 'ordered_at'] },
  'Chantiers': { table: 'sites', title: 'Chantiers', columns: ['code', 'name', 'city', 'country'] },
  'Équipements & engins': { table: 'assets', title: 'Équipements & engins', columns: ['sku', 'name', 'kind', 'unit', 'is_active'], filter: 'kind=in.(equipment,machine)' },
  'Mouvements de stock': { table: 'stock_movements', title: 'Mouvements de stock', columns: ['type', 'quantity', 'reference', 'created_at'] },
}

export function getModuleConfig(name) { return moduleConfig[name] }

export async function listModuleRows(name) {
  const config = getModuleConfig(name)
  if (!config) return { rows: [], error: null }
  let query = supabase.from(config.table).select('*').order('created_at', { ascending: false }).limit(50)
  if (config.filter) query = query.or(config.filter)
  const { data, error } = await query
  return { rows: data || [], error }
}

export async function createAsset(payload) {
  const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').single()
  if (profileError) return { data: null, error: profileError }
  return supabase.from('assets').insert({ ...payload, organization_id: profile.organization_id }).select().single()
}

export async function createStockMovement(payload) {
  return supabase.from('stock_movements').insert(payload).select().single()
}
