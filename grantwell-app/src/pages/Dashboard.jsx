import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Link } from 'react-router-dom'
import { stats, monthlyData, applications } from '../data/mockData'
import './Dashboard.css'

const STATUS_LABELS = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En revision',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const STATUS_COLORS = {
  draft: '#94a3b8',
  submitted: '#3b82f6',
  in_review: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
}

const pieData = [
  { name: 'Aprobadas', value: stats.approved, color: '#22c55e' },
  { name: 'En revision', value: stats.inReview, color: '#f59e0b' },
  { name: 'Rechazadas', value: stats.rejected, color: '#ef4444' },
  { name: 'Borrador', value: stats.draft, color: '#94a3b8' },
]

export default function Dashboard() {
  const recentApps = [...applications].sort((a, b) => {
    const da = a.timeline[a.timeline.length - 1].date
    const db = b.timeline[b.timeline.length - 1].date
    return db.localeCompare(da)
  }).slice(0, 4)

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Resumen de actividad de financiamiento</p>
        </div>
        <Link to="/grants" className="header-action">
          + Buscar nueva oportunidad
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalApplied}</div>
            <div className="stat-label">Postulaciones totales</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">Aprobadas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inReview}</div>
            <div className="stat-label">En revision</div>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon white">💰</div>
          <div className="stat-content">
            <div className="stat-value">USD {stats.totalFunded.toLocaleString()}</div>
            <div className="stat-label">Fondos obtenidos</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card wide">
          <h3>Postulaciones por mes — 2026</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="enviadas" fill="#3b82f6" radius={[4,4,0,0]} name="Enviadas" />
              <Bar dataKey="aprobadas" fill="#22c55e" radius={[4,4,0,0]} name="Aprobadas" />
              <Bar dataKey="rechazadas" fill="#ef4444" radius={[4,4,0,0]} name="Rechazadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card narrow">
          <h3>Estado actual</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {pieData.map((d, i) => (
              <div key={i} className="pie-legend-item">
                <span className="pie-dot" style={{ background: d.color }}></span>
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recent-section">
        <div className="section-header">
          <h3>Actividad reciente</h3>
          <Link to="/applications" className="see-all">Ver todas →</Link>
        </div>
        <div className="recent-table">
          <table>
            <thead>
              <tr>
                <th>Grant</th>
                <th>Financiador</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Ultima actividad</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.map(app => {
                const lastEvent = app.timeline[app.timeline.length - 1]
                return (
                  <tr key={app.id}>
                    <td>
                      <div className="app-name">{app.grantName}</div>
                      <div className="app-project">{app.projectName}</div>
                    </td>
                    <td>{app.funder}</td>
                    <td className="amount">{app.currency} {app.amount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td>
                      <div className="last-event">{lastEvent.event}</div>
                      <div className="last-date">{lastEvent.date}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat">
          <span className="qs-label">Tasa de aprobacion</span>
          <span className="qs-value">{stats.successRate}%</span>
        </div>
        <div className="quick-stat">
          <span className="qs-label">Tiempo promedio de respuesta</span>
          <span className="qs-value">{stats.avgResponseDays} dias</span>
        </div>
        <div className="quick-stat">
          <span className="qs-label">Proxima deadline</span>
          <span className="qs-value highlight-text">15 Jul 2026</span>
        </div>
      </div>
    </div>
  )
}
