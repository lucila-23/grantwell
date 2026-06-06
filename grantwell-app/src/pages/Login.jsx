import { useState } from 'react'
import { login, register } from '../api'
import './Login.css'

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [contactName, setContactName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await register(email, password, orgName, contactName)
      } else {
        await login(email, password)
      }
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">GW</div>
          <h1>GrantWell</h1>
        </div>
        <p className="login-tagline">
          La plataforma que conecta ONGs con oportunidades de financiamiento.
          Gestiona tus postulaciones, hace seguimiento y nunca pierdas una oportunidad.
        </p>
        <div className="login-features">
          <div className="login-feature">
            <span>🎯</span>
            <span>Base de grants actualizada</span>
          </div>
          <div className="login-feature">
            <span>📊</span>
            <span>Timeline de postulaciones</span>
          </div>
          <div className="login-feature">
            <span>⚡</span>
            <span>Autocompletado inteligente</span>
          </div>
          <div className="login-feature">
            <span>💜</span>
            <span>Gestion de donantes</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>{isRegister ? 'Crear cuenta' : 'Iniciar sesion'}</h2>
          <p className="login-form-sub">
            {isRegister
              ? 'Registra tu organizacion para empezar'
              : 'Ingresa a tu cuenta de GrantWell'}
          </p>

          {error && <div className="login-error">{error}</div>}

          {isRegister && (
            <>
              <div className="login-field">
                <label>Nombre de la organizacion</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Fundacion Raices Urbanas"
                  required
                />
              </div>
              <div className="login-field">
                <label>Nombre de contacto</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
            </>
          )}

          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@organizacion.org"
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesion'}
          </button>

          <div className="login-toggle">
            {isRegister ? (
              <span>Ya tenes cuenta? <button type="button" onClick={() => setIsRegister(false)}>Inicia sesion</button></span>
            ) : (
              <span>No tenes cuenta? <button type="button" onClick={() => setIsRegister(true)}>Registrate</button></span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
