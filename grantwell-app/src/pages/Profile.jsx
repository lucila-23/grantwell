import { useState } from 'react'
import { orgProfile } from '../data/mockData'
import './Profile.css'

export default function Profile() {
  const [profile, setProfile] = useState(orgProfile)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>Mi Organizacion</h1>
          <p className="page-subtitle">Datos de tu ONG para postulaciones y autofill</p>
        </div>
        <div className="header-actions">
          {saved && <span className="saved-badge">Guardado correctamente</span>}
          {editing ? (
            <button className="btn-save" onClick={handleSave}>Guardar cambios</button>
          ) : (
            <button className="btn-edit" onClick={() => setEditing(true)}>Editar perfil</button>
          )}
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-main">
          <div className="profile-card">
            <div className="card-header">
              <h2>Informacion general</h2>
            </div>
            <div className="profile-form">
              <div className="form-group">
                <label>Nombre de la organizacion</label>
                {editing ? (
                  <input type="text" value={profile.name} onChange={e => handleChange('name', e.target.value)} />
                ) : (
                  <div className="field-value">{profile.name}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Persona de contacto</label>
                  {editing ? (
                    <input type="text" value={profile.contact} onChange={e => handleChange('contact', e.target.value)} />
                  ) : (
                    <div className="field-value">{profile.contact}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  {editing ? (
                    <input type="email" value={profile.email} onChange={e => handleChange('email', e.target.value)} />
                  ) : (
                    <div className="field-value">{profile.email}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sitio web</label>
                  {editing ? (
                    <input type="url" value={profile.website} onChange={e => handleChange('website', e.target.value)} />
                  ) : (
                    <div className="field-value">{profile.website}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Ano de fundacion</label>
                  {editing ? (
                    <input type="number" value={profile.founded} onChange={e => handleChange('founded', e.target.value)} />
                  ) : (
                    <div className="field-value">{profile.founded}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pais</label>
                  {editing ? (
                    <input type="text" value={profile.country} onChange={e => handleChange('country', e.target.value)} />
                  ) : (
                    <div className="field-value">{profile.country}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Area tematica</label>
                  {editing ? (
                    <input type="text" value={profile.area} onChange={e => handleChange('area', e.target.value)} />
                  ) : (
                    <div className="field-value">{profile.area}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Mision</label>
                {editing ? (
                  <textarea value={profile.mission} onChange={e => handleChange('mission', e.target.value)} rows={4} />
                ) : (
                  <div className="field-value text-block">{profile.mission}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="profile-preview-card">
            <div className="preview-avatar">
              {profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <h3>{profile.name}</h3>
            <p className="preview-area">{profile.area}</p>
            <p className="preview-country">{profile.country} — desde {profile.founded}</p>
            <div className="preview-divider"></div>
            <div className="preview-stat-row">
              <div className="preview-stat">
                <div className="ps-value">5</div>
                <div className="ps-label">Postulaciones</div>
              </div>
              <div className="preview-stat">
                <div className="ps-value">1</div>
                <div className="ps-label">Aprobadas</div>
              </div>
              <div className="preview-stat">
                <div className="ps-value">25%</div>
                <div className="ps-label">Tasa exito</div>
              </div>
            </div>
          </div>

          <div className="profile-tip-card">
            <h4>Tip: Completa tu perfil</h4>
            <p>Un perfil completo permite que la extension GrantFill autocomplete las postulaciones por vos. Cuantos mas datos cargues, menos tiempo te va a llevar cada postulacion.</p>
          </div>

          <div className="profile-tip-card">
            <h4>Documentos frecuentes</h4>
            <ul className="docs-list">
              <li>
                <span className="doc-icon">📄</span>
                <span>Estatuto social</span>
                <span className="doc-status uploaded">Cargado</span>
              </li>
              <li>
                <span className="doc-icon">📄</span>
                <span>Ultimo balance</span>
                <span className="doc-status uploaded">Cargado</span>
              </li>
              <li>
                <span className="doc-icon">📄</span>
                <span>Carta de presentacion</span>
                <span className="doc-status pending">Pendiente</span>
              </li>
              <li>
                <span className="doc-icon">📄</span>
                <span>CV directivos</span>
                <span className="doc-status uploaded">Cargado</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
