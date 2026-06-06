import { useState, useEffect } from 'react'
import { getGrants, createApplication } from '../api'
import './Grants.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'open', label: 'Abiertas' },
  { value: 'forecast', label: 'Previstas' },
  { value: 'closed', label: 'Cerradas' },
  { value: 'awarded', label: 'Adjudicadas' },
]

const STATUS_LABELS = {
  open: 'Abierta',
  forecast: 'Prevista',
  closed: 'Cerrada',
  awarded: 'Adjudicada',
}

function formatLocations(str) {
  if (!str) return null
  const parts = str.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length <= 3) return parts.join(', ')
  return `${parts.slice(0, 3).join(', ')} +${parts.length - 3} más`
}

function formatBudget(budget, currency) {
  if (!budget || budget <= 0) return null
  return `${currency || ''} ${budget.toLocaleString()}`.trim()
}

export function Grants() {
  const [grants, setGrants] = useState([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Per-grant application state, keyed by grant id: { status: 'applying'|'applied'|'error', message? }
  const [applied, setApplied] = useState({})

  const handleApply = async (grant) => {
    window.open(grant.url, '_blank')
    const current = applied[grant.id]?.status
    console.log('current', current)
    if (current === 'applying' || current === 'applied') return // avoid double-submit
    setApplied(s => ({ ...s, [grant.id]: { status: 'applying' } }))
    try {
      await createApplication(grant.id)
      setApplied(s => ({ ...s, [grant.id]: { status: 'applied' } }))
    } catch (err) {
      setApplied(s => ({ ...s, [grant.id]: { status: 'error', message: err.message } }))
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    // Debounce the text search so we don't fire a request per keystroke.
    const handle = setTimeout(() => {
      getGrants({ q: query, status, limit: 60 })
        .then(data => {
          setGrants(data.items || [])
          setTotal(data.total || 0)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [query, status])

  return (
    <div className="grants-page">
      <div className="page-header">
        <div>
          <h1>Grants Disponibles</h1>
          <p className="page-subtitle">Oportunidades de financiamiento de developmentaid.org</p>
        </div>
      </div>

      <div className="grants-toolbar">
        <input
          className="grants-search"
          type="search"
          placeholder="Buscar por nombre…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="grants-filters">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${status === opt.value ? 'active' : ''}`}
              onClick={() => setStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="grants-error">No se pudieron cargar los grants: {error}</div>}

      {loading ? (
        <div className="grants-empty">Cargando oportunidades…</div>
      ) : grants.length === 0 ? (
        <div className="grants-empty">No se encontraron grants con esos filtros.</div>
      ) : (
        <>
          <div className="grants-count">{total} oportunidad{total === 1 ? '' : 'es'}</div>
          <div className="grants-grid">
            {grants.map(g => {
              const locations = formatLocations(g.location_names)
              const budget = formatBudget(g.budget, g.currency)
              const app = applied[g.id]
              return (
                <div
                  key={g.id}
                  className={`grant-card ${app?.status === 'applied' ? 'applied' : ''}`}
                  onClick={() => handleApply(g)}
                  role="button"
                  tabIndex={0}
                  title="Postularte a esta oportunidad"
                >
                  <div className="grant-card-top">
                    <span className={`grant-status status-${g.status}`}>
                      {STATUS_LABELS[g.status] || g.status || '—'}
                    </span>
                    {g.deadline && <span className="grant-deadline">Fecha de cierre: {new Date(g.deadline).toLocaleDateString('es-AR')}</span>}
                  </div>
                  <h3 className="grant-name">
                    {
                      g.name
                    }
                  </h3>
                  {g.donors && <p className="grant-donor">{g.donors}</p>}
                  {g.sector && <p className="grant-sector">{g.sector}</p>}
                  <div className="grant-card-footer">
                    {locations && <span className="grant-location">📍 {locations}</span>}
                    {budget && <span className="grant-budget">{budget}</span>}
                  </div>
                  {app && (
                    <div className={`grant-apply grant-apply-${app.status}`}>
                      {app.status === 'applying' && 'Postulando…'}
                      {app.status === 'applied' && '✓ Postulación enviada'}
                      {app.status === 'error' && `Error: ${app.message}`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function Donors() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">💜</div>
      <h1>Donantes Individuales</h1>
      <p>Gestion del funnel de donantes: captacion, conversion, cobro, recuperacion y fidelizacion.</p>
      <div className="placeholder-badge">En desarrollo por el equipo</div>
      <div className="placeholder-features">
        <div className="pf-item">
          <span>👥</span>
          <span>Base de donantes unificada</span>
        </div>
        <div className="pf-item">
          <span>📱</span>
          <span>Integracion con WhatsApp</span>
        </div>
        <div className="pf-item">
          <span>💳</span>
          <span>Gestion de debitos rechazados</span>
        </div>
        <div className="pf-item">
          <span>📈</span>
          <span>Metricas de retencion</span>
        </div>
      </div>
    </div>
  )
}

export function Autofill() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">⚡</div>
      <h1>PolenFill Extension</h1>
      <p>Extension de Chrome que autocompleta formularios de postulacion con los datos de tu organizacion.</p>
      <div className="placeholder-badge installed">Extension disponible</div>
      <div className="autofill-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div>
            <h3>Instala la extension</h3>
            <p>Descarga e instala PolenFill en Chrome desde chrome://extensions</p>
          </div>
        </div>
        <div className="step">
          <div className="step-number">2</div>
          <div>
            <h3>Carga tu perfil</h3>
            <p>Los datos de "Mi Organizacion" se sincronizan con la extension</p>
          </div>
        </div>
        <div className="step">
          <div className="step-number">3</div>
          <div>
            <h3>Postulate en 1 click</h3>
            <p>Navega a cualquier formulario de grant y usa PolenFill para autocompletar</p>
          </div>
        </div>
      </div>
    </div>
  )
}
