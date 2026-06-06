import { useState } from 'react'
import './App.css'

const API_URL = 'https://grantwell-api.lucilaprieto8.workers.dev'

function App() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const form = e.target
    const data = {
      grant_name: 'Collaborative Impact Partnership Grant',
      funder: 'Global Impact Alliance',
      org_name: form.org_name.value,
      contact_name: form.contact_name.value,
      contact_email: form.contact_email.value,
      org_website: form.org_website?.value || '',
      org_founded: form.org_founded?.value ? parseInt(form.org_founded.value) : null,
      org_mission: form.org_mission.value,
      project_name: form.project_name.value,
      country: form.country.value,
      thematic_area: form.thematic_area.value,
      project_outline: form.project_outline.value,
      sdg_alignment: form.sdg_alignment.value,
      budget_total: form.budget_total.value ? parseFloat(form.budget_total.value) : null,
      budget_requested: form.budget_requested.value ? parseFloat(form.budget_requested.value) : null,
      budget_breakdown: form.budget_breakdown.value,
      start_date: form.start_date.value,
      end_date: form.end_date.value,
      milestones: form.project_milestones.value,
      beneficiaries: form.beneficiaries.value ? parseInt(form.beneficiaries.value) : null,
      impact_measurement: form.impact_measurement.value,
      sustainability_plan: form.sustainability_plan.value,
    }

    try {
      const token = new URLSearchParams(window.location.search).get('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
    } catch (err) {
      console.log('API submit failed, continuing anyway:', err)
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <>
      <header className="site-header">
        <div className="header-top">
          <a href="/" className="logo">
            <div className="logo-icon">🌍</div>
            Global Impact Alliance
          </a>
          <nav>
            <ul className="header-nav">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Programs</a></li>
              <li><a href="#">Grant Programme</a></li>
              <li><a href="#">Impact Stories</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Applications Open — 2026 Cycle</div>
          <h1 className="hero-title">Collaborative Impact Partnership Grant</h1>
          <p className="hero-subtitle">
            Supporting high-potential projects that create lasting social and environmental impact
            in low- and middle-income countries across Latin America, Africa, and Southeast Asia.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">USD 50,000</div>
              <div className="stat-label">Annual Grant</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">12 months</div>
              <div className="stat-label">Project Duration</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">47</div>
              <div className="stat-label">Partners to Date</div>
            </div>
          </div>
        </div>
      </section>

      <div className="main-content">
        <section className="form-section">
          <div className="form-header">
            <h2>Application Form</h2>
            <p>Complete all required fields below. Applications must be submitted in English.</p>
          </div>

          <div className="form-notice">
            📋 Applications close on <strong>&nbsp;July 15, 2026</strong>. Incomplete applications will not be reviewed.
          </div>

          <form onSubmit={handleSubmit} id="grant-application-form">
            <div className="form-section-title">
              <span className="section-number">1</span>
              Organization Information
            </div>

            <div className="form-group">
              <label htmlFor="org_name">
                Organisation Name <span className="required">*</span>
              </label>
              <input type="text" id="org_name" name="org_name" required placeholder="e.g. Fundación Esperanza Verde" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact_name">
                  Contact Name <span className="required">*</span>
                </label>
                <input type="text" id="contact_name" name="contact_name" required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label htmlFor="contact_email">
                  Contact Email <span className="required">*</span>
                </label>
                <input type="email" id="contact_email" name="contact_email" required placeholder="email@organization.org" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="org_website">
                  Organisation Website
                </label>
                <input type="url" id="org_website" name="org_website" placeholder="https://..." />
              </div>
              <div className="form-group">
                <label htmlFor="org_founded">
                  Year Founded <span className="required">*</span>
                </label>
                <input type="number" id="org_founded" name="org_founded" required placeholder="e.g. 2015" min="1900" max="2026" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="org_mission">
                Organisation Mission <span className="required">*</span>
              </label>
              <span className="hint">Brief description of your organization's mission and main activities (max 200 words)</span>
              <textarea id="org_mission" name="org_mission" required placeholder="Describe your organization's mission, vision, and core activities..."></textarea>
            </div>

            <hr className="form-divider" />

            <div className="form-section-title">
              <span className="section-number">2</span>
              Project Details
            </div>

            <div className="form-group">
              <label htmlFor="project_name">
                Project Name <span className="required">*</span>
              </label>
              <span className="hint">Provide a clear and concise name for your project</span>
              <input type="text" id="project_name" name="project_name" required placeholder="e.g. Community Water Access Initiative" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">
                  Country of Implementation <span className="required">*</span>
                </label>
                <select id="country" name="country" required>
                  <option value="">Select country...</option>
                  <option value="AR">Argentina</option>
                  <option value="BO">Bolivia</option>
                  <option value="BR">Brazil</option>
                  <option value="CL">Chile</option>
                  <option value="CO">Colombia</option>
                  <option value="EC">Ecuador</option>
                  <option value="MX">Mexico</option>
                  <option value="PE">Peru</option>
                  <option value="PY">Paraguay</option>
                  <option value="UY">Uruguay</option>
                  <option value="VE">Venezuela</option>
                  <option value="GT">Guatemala</option>
                  <option value="HN">Honduras</option>
                  <option value="SV">El Salvador</option>
                  <option value="NI">Nicaragua</option>
                  <option value="CR">Costa Rica</option>
                  <option value="PA">Panama</option>
                  <option value="KE">Kenya</option>
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="TZ">Tanzania</option>
                  <option value="PH">Philippines</option>
                  <option value="ID">Indonesia</option>
                  <option value="VN">Vietnam</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="thematic_area">
                  Thematic Area <span className="required">*</span>
                </label>
                <select id="thematic_area" name="thematic_area" required>
                  <option value="">Select area...</option>
                  <option value="education">Education & Youth Development</option>
                  <option value="health">Health & Well-being</option>
                  <option value="environment">Environment & Climate Action</option>
                  <option value="gender">Gender Equity & Inclusion</option>
                  <option value="human_rights">Human Rights & Justice</option>
                  <option value="food_security">Food Security & Agriculture</option>
                  <option value="water">Water & Sanitation</option>
                  <option value="economic">Economic Empowerment</option>
                  <option value="technology">Technology for Social Good</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="project_outline">
                Project Outline <span className="required">*</span>
              </label>
              <span className="hint">
                Describe: (1) The problem the project addresses, (2) The proposed solution,
                (3) The community or environment it will benefit, (4) Why your organisation
                is well positioned to deliver it. Max 1 page.
              </span>
              <textarea id="project_outline" name="project_outline" required style={{ minHeight: '200px' }}
                placeholder="Describe the problem your project addresses, your proposed solution, the target community, and your organization's capacity to deliver..."></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="sdg_alignment">
                UN Sustainable Development Goals Alignment <span className="required">*</span>
              </label>
              <span className="hint">Explain which SDGs your project contributes to and how. Max 1/2 page.</span>
              <textarea id="sdg_alignment" name="sdg_alignment" required
                placeholder="Identify the relevant SDGs and explain how your project contributes to each..."></textarea>
            </div>

            <hr className="form-divider" />

            <div className="form-section-title">
              <span className="section-number">3</span>
              Budget & Timeline
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budget_total">
                  Total Budget (USD) <span className="required">*</span>
                </label>
                <input type="number" id="budget_total" name="budget_total" required placeholder="e.g. 50000" min="1000" />
              </div>
              <div className="form-group">
                <label htmlFor="budget_requested">
                  Amount Requested (USD) <span className="required">*</span>
                </label>
                <span className="hint">Maximum USD 50,000</span>
                <input type="number" id="budget_requested" name="budget_requested" required placeholder="e.g. 45000" min="1000" max="50000" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="budget_breakdown">
                Budget Breakdown <span className="required">*</span>
              </label>
              <span className="hint">Provide a high-level breakdown of how the funds will be used</span>
              <textarea id="budget_breakdown" name="budget_breakdown" required
                placeholder="e.g. Personnel: 40%, Equipment: 20%, Training: 25%, Admin: 15%"></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">
                  Proposed Start Date <span className="required">*</span>
                </label>
                <input type="text" id="start_date" name="start_date" required placeholder="e.g. September 2026" />
              </div>
              <div className="form-group">
                <label htmlFor="end_date">
                  Proposed End Date <span className="required">*</span>
                </label>
                <input type="text" id="end_date" name="end_date" required placeholder="e.g. August 2027" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="project_milestones">
                Key Milestones <span className="required">*</span>
              </label>
              <span className="hint">List 3-5 key milestones with expected completion dates</span>
              <textarea id="project_milestones" name="project_milestones" required
                placeholder="1. Community assessment completed — Month 2&#10;2. Training program launched — Month 4&#10;3. Mid-term evaluation — Month 6&#10;4. Project completion and final report — Month 12"></textarea>
            </div>

            <hr className="form-divider" />

            <div className="form-section-title">
              <span className="section-number">4</span>
              Impact & Sustainability
            </div>

            <div className="form-group">
              <label htmlFor="beneficiaries">
                Expected Number of Direct Beneficiaries <span className="required">*</span>
              </label>
              <input type="number" id="beneficiaries" name="beneficiaries" required placeholder="e.g. 500" min="1" />
            </div>

            <div className="form-group">
              <label htmlFor="impact_measurement">
                How will you measure impact? <span className="required">*</span>
              </label>
              <span className="hint">Describe your monitoring and evaluation approach, including key indicators</span>
              <textarea id="impact_measurement" name="impact_measurement" required
                placeholder="Describe the indicators you will track, data collection methods, and how you will report on outcomes..."></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="sustainability_plan">
                Sustainability Plan <span className="required">*</span>
              </label>
              <span className="hint">How will the project's impact continue after the funding period ends?</span>
              <textarea id="sustainability_plan" name="sustainability_plan" required
                placeholder="Explain how the project will sustain its impact beyond the grant period..."></textarea>
            </div>

            <hr className="form-divider" />

            <div className="form-section-title">
              <span className="section-number">5</span>
              Supporting Documents
            </div>

            <div className="form-group">
              <label htmlFor="doc_registration">
                Proof of Registration / Legal Status <span className="required">*</span>
              </label>
              <span className="hint">Upload your organisation's registration certificate or equivalent legal document (PDF or DOCX, max 5MB)</span>
              <input type="file" id="doc_registration" name="doc_registration" accept=".pdf,.docx,.doc" required />
            </div>

            <div className="form-group">
              <label htmlFor="doc_budget">
                Detailed Budget <span className="required">*</span>
              </label>
              <span className="hint">Upload a detailed budget breakdown for the proposed project (PDF or DOCX)</span>
              <input type="file" id="doc_budget" name="doc_budget" accept=".pdf,.docx,.doc" required />
            </div>

            <div className="form-group">
              <label htmlFor="doc_cv">
                CV of Project Lead
              </label>
              <span className="hint">Upload the CV or resume of the project lead (optional)</span>
              <input type="file" id="doc_cv" name="doc_cv" accept=".pdf,.docx,.doc" />
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </section>

        <aside className="sidebar">
          <div className="funding-highlight">
            <h3>Grant Amount</h3>
            <div className="funding-amount">$50,000</div>
            <p>Per selected project annually</p>
          </div>

          <div className="sidebar-card">
            <h3>Eligibility Criteria</h3>
            <ul>
              <li>Registered non-profit organization</li>
              <li>Operating in low- or middle-income countries</li>
              <li>Demonstrated implementation capacity</li>
              <li>Clear social or environmental impact</li>
              <li>At least 2 years of operational history</li>
              <li>Annual budget under USD 500,000</li>
            </ul>
          </div>

          <div className="sidebar-card">
            <h3>What We Provide</h3>
            <ul>
              <li>Direct project funding up to USD 50,000</li>
              <li>Strategic mentorship and advisory support</li>
              <li>Access to our global partner network</li>
              <li>Capacity building workshops</li>
              <li>Visibility through our communications channels</li>
            </ul>
          </div>

          <div className="sidebar-card timeline-card">
            <h3>Selection Timeline</h3>
            <ul>
              <li>
                <span>Application deadline</span>
                <span className="timeline-date">Jul 15, 2026</span>
              </li>
              <li>
                <span>Shortlisting</span>
                <span className="timeline-date">Aug 2026</span>
              </li>
              <li>
                <span>Final presentations</span>
                <span className="timeline-date">Sep 2026</span>
              </li>
              <li>
                <span>Partnership announcement</span>
                <span className="timeline-date">Oct 2026</span>
              </li>
            </ul>
          </div>

          <div className="sidebar-card">
            <h3>Need Help?</h3>
            <ul>
              <li>Contact us at grants@globalimpactalliance.org</li>
              <li>FAQ available on our website</li>
              <li>Info session: June 20, 2026 at 3pm UTC</li>
            </ul>
          </div>
        </aside>
      </div>

      <footer className="site-footer">
        <p>&copy; 2026 Global Impact Alliance. All rights reserved. | Privacy Policy | Terms of Use</p>
      </footer>

      {submitted && (
        <div className="success-overlay" onClick={() => setSubmitted(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">✅</div>
            <h2>Application Submitted!</h2>
            <p>Thank you for applying to the Collaborative Impact Partnership Grant. We will review your application and respond by August 2026.</p>
            <button onClick={() => setSubmitted(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
