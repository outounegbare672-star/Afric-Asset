import { useEffect, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowUpRight, BarChart3, Bell, Boxes, Building2, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Menu, PackageSearch, Search, Settings, Sparkles, Truck, UserPlus, Users, X } from 'lucide-react'
import { supabase } from './services/supabase'
import ModulePanel from './components/ModulePanel'
import './App.css'

const navigation = [
  ['Tableau de bord', LayoutDashboard], ['Stocks & inventaires', Boxes], ['Mouvements de stock', Activity], ['Matériaux', PackageSearch],
  ['Équipements & engins', Truck], ['Achats', ClipboardList], ['Chantiers', Building2], ['Collaborateurs', Users],
]
const kpis = [
  ['Valeur totale du stock', '186 420 €', '+12,8 %', 'violet', Boxes], ['Articles en stock', '2 846', '+6,4 %', 'blue', PackageSearch],
  ['Alertes de rupture', '18', 'À traiter', 'orange', Bell], ['Mouvements ce mois', '1 284', '+18,2 %', 'green', Activity],
]

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); setError(''); setMessage('') }
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('')
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (authError) throw authError
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name } } })
        if (authError) throw authError
        if (!data.session) setMessage('Inscription réussie. Vérifiez votre email pour activer votre compte.')
      }
    } catch (authError) { setError(authError.message || 'Une erreur est survenue.') } finally { setLoading(false) }
  }

  return <main className="auth-page"><div className="auth-brand"><div className="brand-mark"><span>AA</span></div><div><strong>AFRIC-ASSET</strong><small>AI PLATFORM</small></div></div><section className="auth-card"><div className="auth-icon">{mode === 'login' ? <Sparkles size={24} /> : <UserPlus size={24} />}</div><p className="eyebrow">PLATEFORME DE GESTION DE CHANTIER</p><h1>{mode === 'login' ? 'Bienvenue à nouveau' : 'Créer votre compte'}</h1><p className="auth-subtitle">{mode === 'login' ? 'Connectez-vous pour piloter vos actifs.' : 'Commencez à centraliser vos opérations.'}</p><form onSubmit={submit}>{mode === 'signup' && <label>Nom complet<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Marie Dupont" /></label>}<label>Email professionnel<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="vous@entreprise.com" /></label><label>Mot de passe<input required minLength="6" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="6 caractères minimum" /></label>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'Connexion en cours...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button></form><button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}>{mode === 'login' ? 'Pas encore de compte ? Créer un compte' : 'Déjà inscrit ? Se connecter'}</button></section><p className="auth-security"><span className="secure-dot" />Vos données sont protégées par Supabase Auth</p></main>
}

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('Tableau de bord')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantText, setAssistantText] = useState('')
  const [assistantAnswer, setAssistantAnswer] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session); setAuthLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  if (authLoading) return <div className="loading-screen"><div className="brand-mark"><span>AA</span></div><p>Chargement de votre espace sécurisé...</p></div>
  if (!session) return <AuthScreen />

  const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Utilisateur'
  const initials = userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const showNotice = (text) => { setNotice(text); window.setTimeout(() => setNotice(''), 2600) }
  async function logout() { await supabase.auth.signOut() }
  function exportReport() {
    const rows = [['Indicateur', 'Valeur'], ['Valeur totale du stock', '186420'], ['Articles en stock', '2846'], ['Alertes de rupture', '18'], ['Mouvements ce mois', '1284']]
    const blob = new Blob([rows.map((row) => row.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'afric-asset-rapport.csv'; link.click(); URL.revokeObjectURL(url); showNotice('Rapport exporté avec succès')
  }
  function askAssistant(event) { event.preventDefault(); if (!assistantText.trim()) return; setAssistantAnswer(`Analyse en cours pour : « ${assistantText.trim()} ». Les données seront interrogées via l’API sécurisée AFRIC-ASSET AI.`); setAssistantText('') }

  return <div className="app-shell">
    {notice && <div className="toast-notice">{notice}</div>}
    {active !== 'Tableau de bord' && <ModulePanel module={active} onClose={() => setActive('Tableau de bord')} onNotice={showNotice} />}
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}><div className="brand"><div className="brand-mark"><span>AA</span></div><div><strong>AFRIC-ASSET</strong><small>AI PLATFORM</small></div><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X size={20} /></button></div><div className="workspace-switcher"><div className="workspace-avatar">AA</div><div><span>Mon organisation</span><small>{session.user.email}</small></div><ChevronDown size={16} /></div><nav className="main-nav" aria-label="Navigation principale"><p className="nav-caption">ESPACE DE TRAVAIL</p>{navigation.map(([label, Icon]) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => { setActive(label); setMenuOpen(false); showNotice(`${label} sera disponible dans le prochain module`) }}><Icon size={18} /><span>{label}</span>{label === 'Stocks & inventaires' && <b className="nav-badge">18</b>}</button>)}<p className="nav-caption nav-caption-spaced">PILOTAGE</p><button className={`nav-item ${active === 'Analyses' ? 'active' : ''}`} onClick={() => setActive('Analyses')}><BarChart3 size={18} /><span>Analyses & rapports</span></button><button className={`nav-item ${active === 'Assistant IA' ? 'active' : ''}`} onClick={() => { setActive('Assistant IA'); setAssistantOpen(true) }}><Sparkles size={18} /><span>Assistant IA</span><span className="new-pill">NEW</span></button></nav><div className="sidebar-footer"><button className="nav-item" onClick={() => showNotice('Les paramètres seront disponibles prochainement')}><Settings size={18} /><span>Paramètres</span></button><button className="nav-item logout-button" onClick={logout}><LogOut size={18} /><span>Se déconnecter</span></button><div className="secure-note"><span className="secure-dot" />Session Supabase sécurisée</div></div></aside>
    <main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu size={22} /></button><div className="breadcrumb"><span>Vue d'ensemble</span><strong>{active}</strong></div><div className="topbar-actions"><div className="search-box"><Search size={17} /><input aria-label="Rechercher" placeholder="Rechercher un actif, un chantier..." onChange={(event) => event.target.value && showNotice(`Recherche de « ${event.target.value} »`)} /></div><button className="icon-button notification" aria-label="Notifications" onClick={() => showNotice('Vous avez 3 alertes à traiter')}><Bell size={19} /><span /></button><button className="user-menu user-menu-button" onClick={logout}><div className="user-avatar">{initials}</div><div className="user-name"><strong>{userName}</strong><small>Se déconnecter</small></div><LogOut size={15} /></button></div></header><div className="content-wrap"><section className="welcome-row"><div><p className="eyebrow">ESPACE SÉCURISÉ</p><h1>Bonjour {userName.split(' ')[0]} <span>👋</span></h1><p className="subtitle">Voici ce qui se passe sur vos chantiers aujourd'hui.</p></div><button className="primary-button" onClick={exportReport}><ArrowDownToLine size={17} />Exporter le rapport</button></section><section className="kpi-grid" aria-label="Indicateurs clés">{kpis.map(([label, value, delta, tone, Icon]) => <article className="kpi-card" key={label}><div className={`kpi-icon ${tone}`}><Icon size={20} /></div><div className="kpi-body"><span>{label}</span><strong>{value}</strong><small className={tone === 'orange' ? 'orange-text' : ''}>{tone !== 'orange' && <ArrowUpRight size={13} />}{delta}</small></div><div className="sparkline" /></article>)}</section><section className="dashboard-grid"><article className="panel stock-panel"><div className="panel-heading"><div><h2>Évolution de la valeur du stock</h2><p>Valeur totale sur les 6 derniers mois</p></div><button className="select-button" onClick={() => showNotice('Période : 6 derniers mois')}>6 derniers mois <ChevronDown size={15} /></button></div><div className="chart-area"><div className="chart-y"><span>200k</span><span>150k</span><span>100k</span><span>50k</span><span>0</span></div><div className="chart"><div className="chart-grid-lines" /><svg viewBox="0 0 650 220" preserveAspectRatio="none" aria-label="Graphique de la valeur du stock"><defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7667f5" stopOpacity=".28" /><stop offset="100%" stopColor="#7667f5" stopOpacity="0" /></linearGradient></defs><path d="M0,165 C55,145 75,150 115,135 S185,145 220,118 S285,105 330,120 S400,80 445,92 S515,62 555,70 S610,30 650,40 V220 H0 Z" fill="url(#areaGradient)" /><path d="M0,165 C55,145 75,150 115,135 S185,145 220,118 S285,105 330,120 S400,80 445,92 S515,62 555,70 S610,30 650,40" fill="none" stroke="#7667f5" strokeWidth="3" /></svg><div className="chart-x"><span>Mai</span><span>Juin</span><span>Juil.</span><span>Août</span><span>Sept.</span><span>Oct.</span></div></div></div></article><article className="panel alerts-panel"><div className="panel-heading"><div><h2>Alertes à traiter</h2><p>Priorités de votre organisation</p></div><button className="text-button" onClick={() => showNotice('3 alertes prioritaires affichées')}>Voir tout</button></div><div className="alert-list"><div className="alert-item"><div className="alert-symbol critical">!</div><div><strong>Stock critique</strong><p>Ciment CPJ 35 — 12 sacs restants</p></div><span className="alert-time">Il y a 2h</span></div><div className="alert-item"><div className="alert-symbol warning">!</div><div><strong>Maintenance prévue</strong><p>Grue mobile GM-04 — dans 3 jours</p></div><span className="alert-time">Hier</span></div><div className="alert-item"><div className="alert-symbol info">i</div><div><strong>Inventaire à valider</strong><p>Magasin central de Kara</p></div><span className="alert-time">Hier</span></div></div></article></section><section className="bottom-grid"><article className="panel activity-panel"><div className="panel-heading"><div><h2>Activité récente</h2><p>Dernières actions sur la plateforme</p></div><button className="text-button" onClick={() => showNotice('Journal complet disponible après configuration de la base')}>Journal complet</button></div><div className="activity-list"><div className="activity-row"><div className="activity-avatar purple">AD</div><div><strong>André Diallo</strong><p>a réceptionné <b>250 sacs de ciment</b></p></div><time>10:42</time></div><div className="activity-row"><div className="activity-avatar blue">SK</div><div><strong>Sarah Kossi</strong><p>a transféré <b>12 outils</b> vers Chantier Kara</p></div><time>09:18</time></div><div className="activity-row"><div className="activity-avatar green">YM</div><div><strong>Yao Mensah</strong><p>a clôturé l'inventaire du <b>Magasin central</b></p></div><time>Hier</time></div></div></article><article className="panel assistant-card"><div className="assistant-glow" /><div className="assistant-icon"><Sparkles size={23} /></div><h2>Besoin d'une information ?</h2><p>Interrogez vos données avec l'Assistant IA.</p><div className="suggestion">« Quels outils sont affectés au chantier de Kara ? »</div><button className="assistant-button" onClick={() => setAssistantOpen(true)}>Parler à l'assistant <ArrowUpRight size={17} /></button></article></section></div></main>
    {assistantOpen && <div className="modal-backdrop" onClick={() => setAssistantOpen(false)}><section className="assistant-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAssistantOpen(false)}><X size={18} /></button><div className="assistant-icon"><Sparkles size={23} /></div><h2>Assistant IA AFRIC-ASSET</h2><p>Posez une question sur vos stocks, chantiers ou équipements.</p><form onSubmit={askAssistant}><input autoFocus value={assistantText} onChange={(event) => setAssistantText(event.target.value)} placeholder="Ex. Combien reste-t-il de sacs de ciment ?" /><button className="primary-button">Analyser <ArrowUpRight size={16} /></button></form>{assistantAnswer && <div className="assistant-answer">{assistantAnswer}</div>}</section></div>}
  </div>
}

export default App
