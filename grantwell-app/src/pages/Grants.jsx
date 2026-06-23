import { useState, useEffect } from 'react'
import { getGrants, getGrantFilters } from '../api'
import './Grants.css'

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'open', label: 'Abiertas' },
  { value: 'forecast', label: 'Previstas' },
  { value: 'closed', label: 'Cerradas' },
]

const STATUS_LABELS = {
  open: 'Abierta',
  forecast: 'Prevista',
  closed: 'Cerrada',
  awarded: 'Adjudicada',
}

const SORT_OPTIONS = [
  { value: 'deadline', label: 'Fecha de cierre' },
  { value: 'budget_desc', label: 'Mayor presupuesto' },
  { value: 'budget_asc', label: 'Menor presupuesto' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'name', label: 'Nombre A-Z' },
]

const BUDGET_RANGES = [
  { value: '', label: 'Cualquier monto' },
  { value: '0-50000', label: 'Hasta USD 50K' },
  { value: '50000-250000', label: 'USD 50K - 250K' },
  { value: '250000-1000000', label: 'USD 250K - 1M' },
  { value: '1000000-10000000', label: 'USD 1M - 10M' },
  { value: '10000000-', label: 'Más de USD 10M' },
]

function formatBudget(budget, currency) {
  if (!budget || budget <= 0) return null
  if (budget >= 1_000_000) return `${currency || 'USD'} ${(budget / 1_000_000).toFixed(1)}M`
  if (budget >= 1_000) return `${currency || 'USD'} ${(budget / 1_000).toFixed(0)}K`
  return `${currency || 'USD'} ${budget.toLocaleString()}`
}

export function Grants() {
  const [grants, setGrants] = useState([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterData, setFilterData] = useState(null)

  const [source, setSource] = useState('')
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [sort, setSort] = useState('deadline')

  useEffect(() => {
    getGrantFilters().then(setFilterData).catch(() => {})
  }, [])

  const activeFilterCount = [source, region, category, budgetRange].filter(Boolean).length

  useEffect(() => {
    setLoading(true)
    setError('')

    const params = { q: query, status, source, region, category, sort, limit: 60 }
    if (budgetRange) {
      const [min, max] = budgetRange.split('-')
      if (min) params.budget_min = min
      if (max) params.budget_max = max
    }

    const handle = setTimeout(() => {
      getGrants(params)
        .then(data => {
          setGrants(data.items || [])
          setTotal(data.total || 0)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [query, status, source, region, category, budgetRange, sort])

  const clearFilters = () => {
    setSource('')
    setRegion('')
    setCategory('')
    setBudgetRange('')
    setSort('deadline')
  }

  return (
    <div className="grants-page">
      <div className="page-header">
        <div>
          <h1>Grants Disponibles</h1>
          <p className="page-subtitle">{total} oportunidades de Grants.gov y EU Funding</p>
        </div>
      </div>

      <div className="grants-toolbar">
        <input
          className="grants-search"
          type="search"
          placeholder="Buscar por nombre, agencia, sector o descripcion…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          className={`filter-toggle ${filtersOpen ? 'active' : ''} ${activeFilterCount ? 'has-filters' : ''}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filtros{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
      </div>

      <div className="status-bar">
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

      {filtersOpen && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Todas las categorias</option>
                {filterData?.categories?.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Presupuesto</label>
              <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)}>
                {BUDGET_RANGES.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">Todas las regiones</option>
                {filterData?.regions?.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Fuente</label>
              <select value={source} onChange={e => setSource(e.target.value)}>
                <option value="">Todas las fuentes</option>
                {filterData?.sources?.map(s => (
                  <option key={s} value={s}>{s === 'grants.gov' ? 'Grants.gov (US)' : 'EU Funding (Europa)'}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Ordenar por</label>
              <select value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button className="clear-filters" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {error && <div className="grants-error">No se pudieron cargar los grants: {error}</div>}

      {loading ? (
        <div className="grants-empty">Cargando oportunidades…</div>
      ) : grants.length === 0 ? (
        <div className="grants-empty">No se encontraron grants con esos filtros.</div>
      ) : (
        <div className="grants-grid">
          {grants.map(g => {
            const budget = formatBudget(g.budget, g.currency)
            return (
              <a
                key={g.id}
                className="grant-card"
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="grant-card-top">
                  <span className={`grant-status status-${g.status}`}>
                    {STATUS_LABELS[g.status] || g.status || '—'}
                  </span>
                  {g.deadline && <span className="grant-deadline">{g.deadline}</span>}
                </div>
                <h3 className="grant-name">{g.name}</h3>
                {g.donors && <p className="grant-donor">{g.donors}</p>}
                {g.description && (
                  <p className="grant-description">
                    {g.description.length > 120 ? g.description.slice(0, 120) + '…' : g.description}
                  </p>
                )}
                <div className="grant-card-tags">
                  {g.sector && <span className="grant-tag">{g.sector.split(',')[0]}</span>}
                  {g.location_names && <span className="grant-tag">{g.location_names.split(',')[0]}</span>}
                </div>
                <div className="grant-card-footer">
                  {budget && <span className="grant-budget">{budget}</span>}
                  {g.source && <span className="grant-source">{g.source}</span>}
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
