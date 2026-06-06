import { useState, useEffect } from 'react'
import { getApplications as fetchApps } from '../api'
import { applications as mockApplications } from '../data/mockData'
import './Applications.css'

const STATUS_LABELS = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En revision',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const EVENT_ICONS = {
  draft: '📝',
  docs: '📄',
  submitted: '📤',
  received: '✅',
  interview: '🎤',
  approved: '🎉',
  rejected: '❌',
  funded: '💰',
  pending: '⏳',
}

export default function Applications() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [applications, setApplications] = useState(mockApplications)

  useEffect(() => {
    fetchApps()
      .then(apiApps => {
        if (apiApps.length > 0) {
          const merged = [...mockApplications, ...apiApps.map(a => ({
            ...a,
            grantName: a.grant_name,
            projectName: a.project_name,
            submittedDate: a.submitted_at?.split('T')[0],
            deadline: a.end_date || '—',
            amount: a.budget_requested || a.budget_total || 0,
            currency: 'USD',
            timeline: (a.timeline || []).map(t => ({
              date: t.event_date,
              event: t.event,
              type: t.type,
            })),
          }))]
          setApplications(merged)
        }
      })
      .catch(() => {})
  }, [])

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter)

  const selectedApp = selected !== null
    ? applications.find(a => a.id === selected)
    : null

  return (
    <div className="applications-page">
      <div className="page-header">
        <div>
          <h1>Mis Postulaciones</h1>
          <p className="page-subtitle">Seguimiento y timeline de todas tus postulaciones</p>
        </div>
      </div>

      <div className="filter-bar">
        {['all', 'draft', 'submitted', 'in_review', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]}
            <span className="filter-count">
              {f === 'all' ? applications.length : applications.filter(a => a.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="applications-layout">
        <div className="applications-list">
          {filtered.map(app => (
            <div
              key={app.id}
              className={`application-card ${selected === app.id ? 'selected' : ''}`}
              onClick={() => setSelected(app.id)}
            >
              <div className="app-card-header">
                <span className={`status-badge status-${app.status}`}>
                  {STATUS_LABELS[app.status]}
                </span>
                <span className="app-amount">{app.currency} {app.amount.toLocaleString()}</span>
              </div>
              <h3 className="app-card-title">{app.grantName}</h3>
              <p className="app-card-funder">{app.funder}</p>
              <p className="app-card-project">{app.projectName}</p>
              <div className="app-card-footer">
                <span className="app-card-date">
                  {app.submittedDate ? `Enviada: ${app.submittedDate}` : 'Sin enviar'}
                </span>
                <span className="app-card-deadline">Deadline: {app.deadline}</span>
              </div>
              <div className="app-progress-bar">
                <div
                  className={`app-progress-fill progress-${app.status}`}
                  style={{ width: `${(app.timeline.length / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="application-detail">
          {selectedApp ? (
            <>
              <div className="detail-header">
                <h2>{selectedApp.grantName}</h2>
                <span className={`status-badge status-${selectedApp.status}`}>
                  {STATUS_LABELS[selectedApp.status]}
                </span>
              </div>
              <div className="detail-meta">
                <div className="meta-item">
                  <span className="meta-label">Financiador</span>
                  <span className="meta-value">{selectedApp.funder}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Proyecto</span>
                  <span className="meta-value">{selectedApp.projectName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Monto solicitado</span>
                  <span className="meta-value">{selectedApp.currency} {selectedApp.amount.toLocaleString()}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Deadline</span>
                  <span className="meta-value">{selectedApp.deadline}</span>
                </div>
              </div>

              <div className="timeline-section">
                <h3>Timeline de la postulacion</h3>
                <div className="timeline">
                  {selectedApp.timeline.map((event, i) => {
                    const isPast = event.type !== 'pending'
                    const isLast = i === selectedApp.timeline.length - 1
                    return (
                      <div key={i} className={`timeline-item ${isPast ? 'past' : 'future'} ${isLast ? 'last' : ''}`}>
                        <div className="timeline-line-container">
                          <div className={`timeline-dot dot-${event.type}`}>
                            {EVENT_ICONS[event.type] || '📌'}
                          </div>
                          {!isLast && <div className="timeline-line"></div>}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-event">{event.event}</div>
                          <div className="timeline-date">{event.date}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <div className="empty-icon">📋</div>
              <h3>Selecciona una postulacion</h3>
              <p>Hace click en una postulacion para ver su timeline y detalle completo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
