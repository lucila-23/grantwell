import { useState, useRef, useEffect } from 'react'
import { getProfile, updateProfile } from '../api'
import { orgProfile } from '../data/mockData'
import './Profile.css'

// Map the API organization entity <-> the form's field names.
function toForm(org) {
  return {
    name: org.name || '',
    contact: org.contact_name || '',
    email: org.email || '',
    website: org.website || '',
    founded: org.founded || '',
    country: org.country || '',
    area: org.area || '',
    mission: org.mission || '',
  }
}

function toApi(form) {
  return {
    name: form.name || null,
    contact_name: form.contact || null,
    email: form.email,
    website: form.website || null,
    founded: form.founded ? Number(form.founded) : null,
    country: form.country || null,
    area: form.area || null,
    mission: form.mission || null,
  }
}

const DOC_TYPES = [
  { key: 'estatuto', label: 'Estatuto social', icon: '📜' },
  { key: 'balance', label: 'Ultimo balance', icon: '📊' },
  { key: 'carta', label: 'Carta de presentacion', icon: '✉️' },
  { key: 'cv', label: 'CV directivos', icon: '👤' },
  { key: 'proyecto', label: 'Documento de proyecto', icon: '📋' },
  { key: 'presupuesto', label: 'Presupuesto detallado', icon: '💰' },
]

function loadDocs() {
  try {
    return JSON.parse(localStorage.getItem('gw_docs') || '[]')
  } catch { return [] }
}

function saveDocs(docs) {
  localStorage.setItem('gw_docs', JSON.stringify(docs))
}

export default function Profile() {
  const [profile, setProfile] = useState(orgProfile)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [docs, setDocs] = useState(loadDocs)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const [selectedType, setSelectedType] = useState('')

  // Load the organization record from the DB (GET /organizations/:id).
  useEffect(() => {
    getProfile()
      .then(org => setProfile(toForm(org)))
      .catch(() => {}) // keep mock fallback if the fetch fails
  }, [])

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setError('')
    try {
      const updated = await updateProfile(toApi(profile))
      setProfile(toForm(updated))
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleFileSelect = (docType) => {
    setSelectedType(docType)
    fileRef.current?.click()
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten archivos PDF o DOCX')
      return
    }

    setUploading(true)

    const reader = new FileReader()
    reader.onload = () => {
      const newDoc = {
        key: selectedType,
        label: DOC_TYPES.find(d => d.key === selectedType)?.label || selectedType,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        data: reader.result,
        uploadedAt: new Date().toISOString(),
      }

      const updated = [...docs.filter(d => d.key !== selectedType), newDoc]
      setDocs(updated)
      saveDocs(updated)
      setUploading(false)
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveDoc = (key) => {
    const updated = docs.filter(d => d.key !== key)
    setDocs(updated)
    saveDocs(updated)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>Mi Organizacion</h1>
          <p className="page-subtitle">Datos de tu ONG para postulaciones y autofill</p>
        </div>
        <div className="header-actions">
          {error && <span className="saved-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</span>}
          {saved && <span className="saved-badge">Guardado correctamente</span>}
          {editing ? (
            <button className="btn-save" onClick={handleSave}>Guardar cambios</button>
          ) : (
            <button className="btn-edit" onClick={() => setEditing(true)}>Editar perfil</button>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileRef}
        onChange={handleFileUpload}
        accept=".pdf,.docx,.doc"
        style={{ display: 'none' }}
      />

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

          <div className="profile-card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h2>Documentos frecuentes</h2>
              <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                Carga tus documentos para adjuntarlos rapidamente en postulaciones
              </p>
            </div>
            <div className="docs-grid">
              {DOC_TYPES.map(docType => {
                const doc = docs.find(d => d.key === docType.key)
                return (
                  <div key={docType.key} className={`doc-card ${doc ? 'has-file' : ''}`}>
                    <div className="doc-card-icon">{docType.icon}</div>
                    <div className="doc-card-info">
                      <div className="doc-card-label">{docType.label}</div>
                      {doc ? (
                        <>
                          <div className="doc-card-file">{doc.fileName}</div>
                          <div className="doc-card-meta">
                            {formatSize(doc.fileSize)} · {doc.fileType.includes('pdf') ? 'PDF' : 'DOCX'}
                          </div>
                        </>
                      ) : (
                        <div className="doc-card-empty">Sin archivo</div>
                      )}
                    </div>
                    <div className="doc-card-actions">
                      {doc ? (
                        <>
                          <button
                            className="doc-btn-replace"
                            onClick={() => handleFileSelect(docType.key)}
                            disabled={uploading}
                          >
                            Reemplazar
                          </button>
                          <button
                            className="doc-btn-remove"
                            onClick={() => handleRemoveDoc(docType.key)}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          className="doc-btn-upload"
                          onClick={() => handleFileSelect(docType.key)}
                          disabled={uploading}
                        >
                          {uploading && selectedType === docType.key ? 'Subiendo...' : 'Cargar'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
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
            <h4>Documentos y GrantFill</h4>
            <p>Los documentos que cargues aca se sincronizan con la extension GrantFill. Cuando un formulario pida adjuntar archivos, la extension te va a sugerir tus documentos precargados.</p>
          </div>

          <div className="profile-tip-card">
            <h4>Resumen de documentos</h4>
            <div className="docs-summary">
              <div className="docs-summary-item">
                <span className="docs-count">{docs.length}</span>
                <span>de {DOC_TYPES.length} cargados</span>
              </div>
              <div className="docs-progress-bar">
                <div
                  className="docs-progress-fill"
                  style={{ width: `${(docs.length / DOC_TYPES.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
