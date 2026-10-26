import { supabase } from './supabase'

const moduleConfig = {
  'Stocks & inventaires': { table: 'assets', title: 'Stocks & inventaires', columns: ['sku', 'name', 'kind', 'unit', 'minimum_quantity'] },
  Magasins: { table: 'locations', title: 'Magasins', examples: ['Magasin principal', 'Dépôt chantier', 'Entrepôt secondaire'], columns: ['code', 'name', 'kind', 'site_id'] },
  Matériaux: { table: 'assets', title: 'Matériaux', examples: ['Ciment', 'Sable', 'Gravier', 'Fer'], columns: ['sku', 'name', 'category', 'unit', 'minimum_quantity'], filter: 'kind.eq.material' },
  Outils: { table: 'assets', title: 'Outils', examples: ['Marteaux', 'Meuleuses', 'Perceuses'], columns: ['sku', 'name', 'category', 'unit', 'is_active'], filter: 'kind.eq.tool' },
  Équipements: { table: 'assets', title: 'Équipements', examples: ['Échelles', 'Groupes électrogènes', 'Compacteurs'], columns: ['sku', 'name', 'category', 'unit', 'is_active'], filter: 'kind.eq.equipment' },
  Engins: { table: 'assets', title: 'Engins', examples: ['Pelles', 'Bulldozers', 'Grues'], columns: ['sku', 'name', 'category', 'unit', 'is_active'], filter: 'kind.eq.machine' },
  Production: { table: 'assets', title: 'Production', examples: ['Béton', 'Pavés', 'Préfabriqués'], columns: ['sku', 'name', 'category', 'unit', 'is_active'], filter: 'category.eq.production' },
  Achats: { table: 'purchases', title: 'Achats', columns: ['number', 'status', 'total_amount', 'ordered_at'] },
  Chantiers: { table: 'sites', title: 'Vue directeur — chantiers', examples: ['Stocks disponibles', 'Outils présents', 'Engins présents', 'Personnel affecté', 'Consommation journalière'], columns: ['code', 'name', 'city', 'stocks_available', 'tools_present', 'machines_present', 'personnel_assigned', 'daily_consumption'] },
  'Mouvements de stock': { table: 'stock_movements', title: 'Mouvements de stock', columns: ['type', 'quantity', 'reference', 'created_at'] },
}

export function getModuleConfig(name) { return moduleConfig[name] }

async function listSiteOverviews() {
  const [{ data: sites, error: sitesError }, { data: locations, error: locationsError }, { data: movements, error: movementsError }, { data: assets, error: assetsError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.from('sites').select('id, code, name, city, country').order('name'),
    supabase.from('locations').select('id, site_id'),
    supabase.from('stock_movements').select('location_id, asset_id, type, quantity, created_at'),
    supabase.from('assets').select('id, kind'),
    supabase.from('site_assignments').select('site_id, profile_id').eq('is_active', true),
  ])
  const error = sitesError || locationsError || movementsError || assetsError || assignmentsError
  if (error) return { rows: [], error }
  const assetKinds = new Map((assets || []).map((asset) => [asset.id, asset.kind]))
  const locationSites = new Map((locations || []).map((location) => [location.id, location.site_id]))
  const siteStats = new Map((sites || []).map((site) => [site.id, { ...site, stocks_available: 0, tools: new Set(), machines: new Set(), personnel_assigned: 0, daily_consumption: 0 }]))
  for (const assignment of assignments || []) {
    const site = siteStats.get(assignment.site_id)
    if (site) site.personnel_assigned += 1
  }
  const dayStart = Date.now() - 24 * 60 * 60 * 1000
  const inbound = new Set(['receipt', 'transfer_in', 'return', 'adjustment'])
  const consumption = new Set(['issue', 'transfer_out', 'production_consumption'])
  for (const movement of movements || []) {
    const site = siteStats.get(locationSites.get(movement.location_id))
    if (!site) continue
    const quantity = Number(movement.quantity) || 0
    site.stocks_available += inbound.has(movement.type) ? quantity : consumption.has(movement.type) ? -quantity : 0
    if (consumption.has(movement.type) && new Date(movement.created_at).getTime() >= dayStart) site.daily_consumption += quantity
    const kind = assetKinds.get(movement.asset_id)
    if (kind === 'tool') site.tools.add(movement.asset_id)
    if (kind === 'machine') site.machines.add(movement.asset_id)
  }
  return { rows: [...siteStats.values()].map((site) => ({ ...site, stocks_available: Math.max(0, site.stocks_available), tools_present: site.tools.size, machines_present: site.machines.size, personnel_assigned: site.personnel_assigned, daily_consumption: site.daily_consumption, tools: undefined, machines: undefined })), error: null }
}

export async function listModuleRows(name) {
  const config = getModuleConfig(name)
  if (!config) return { rows: [], error: null }
  if (name === 'Chantiers') return listSiteOverviews()
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

export async function getDashboardReport() {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const [{ count: assetCount, error: assetError }, { count: siteCount, error: siteError }, { count: movementCount, error: movementError }] = await Promise.all([
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('sites').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('stock_movements').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
  ])
  return { data: { assetCount: assetCount || 0, siteCount: siteCount || 0, movementCount: movementCount || 0 }, error: assetError || siteError || movementError }
}

export async function askAssistantQuestion(question) {
  const normalized = question.toLowerCase()
  const kind = normalized.includes('outil') ? 'tool' : normalized.includes('engin') || normalized.includes('pelle') || normalized.includes('grue') ? 'machine' : null
  const search = normalized.match(/ciment|sable|gravier|fer|marteau|meuleuse|perceuse|pelle|bulldozer|grue/)?.[0]
  let query = supabase.from('assets').select('id, name, kind, unit').eq('is_active', true).limit(50)
  if (kind) query = query.eq('kind', kind)
  if (search) query = query.ilike('name', `%${search}%`)
  const { data: assets, error: assetError } = await query
  if (assetError) return { answer: '', error: assetError }
  if (!assets?.length) return { answer: 'Aucun actif correspondant n’a été trouvé dans vos données Supabase.', error: null }
  const ids = assets.map((asset) => asset.id)
  const { data: movements, error: movementError } = await supabase.from('stock_movements').select('asset_id, type, quantity').in('asset_id', ids)
  if (movementError) return { answer: '', error: movementError }
  const inbound = new Set(['receipt', 'transfer_in', 'return', 'adjustment'])
  const totals = new Map(assets.map((asset) => [asset.id, 0]))
  for (const movement of movements || []) totals.set(movement.asset_id, (totals.get(movement.asset_id) || 0) + (inbound.has(movement.type) ? Number(movement.quantity) : -Number(movement.quantity)))
  const result = assets.map((asset) => `${asset.name}: ${Math.max(0, totals.get(asset.id) || 0)} ${asset.unit}`).join(' · ')
  return { answer: `Données actuelles : ${result}.`, error: null }
}
