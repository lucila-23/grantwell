import './Grants.css'

export function Grants() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">🎯</div>
      <h1>Grants Disponibles</h1>
      <p>Portal de oportunidades de financiamiento con filtros por monto, area tematica, deadline y region.</p>
      <div className="placeholder-badge">En desarrollo por el equipo</div>
      <div className="placeholder-features">
        <div className="pf-item">
          <span>🔍</span>
          <span>Busqueda inteligente de grants</span>
        </div>
        <div className="pf-item">
          <span>🔔</span>
          <span>Alertas de nuevas oportunidades</span>
        </div>
        <div className="pf-item">
          <span>📊</span>
          <span>Match score con tu perfil</span>
        </div>
        <div className="pf-item">
          <span>⚡</span>
          <span>Postulacion rapida con GrantFill</span>
        </div>
      </div>
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
      <h1>GrantFill Extension</h1>
      <p>Extension de Chrome que autocompleta formularios de postulacion con los datos de tu organizacion.</p>
      <div className="placeholder-badge installed">Extension disponible</div>
      <div className="autofill-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div>
            <h3>Instala la extension</h3>
            <p>Descarga e instala GrantFill en Chrome desde chrome://extensions</p>
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
            <p>Navega a cualquier formulario de grant y usa GrantFill para autocompletar</p>
          </div>
        </div>
      </div>
    </div>
  )
}
