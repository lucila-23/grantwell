const GFORM_MATCHERS = [
  { keys: ['project name', 'nombre del proyecto', 'project title'], profile: 'prof_project_name' },
  { keys: ['organisation name', 'organization name', 'org name', 'nombre de la organizacion', 'nombre organizacion', 'applicant name', 'applicant organization', 'lead organization'], profile: 'prof_org_name' },
  { keys: ['contact name', 'nombre de contacto', 'contact person', 'primary contact', 'full name', 'your name', 'name of contact', 'representative'], profile: 'prof_contact_name' },
  { keys: ['contact details', 'contact email', 'email address', 'email', 'correo', 'e-mail', 'your email'], profile: 'prof_contact_email' },
  { keys: ['country of implementation', 'country', 'pais', 'location', 'where the project', 'geographic', 'region', 'implementation country', 'project location'], profile: 'prof_country' },
  { keys: ['project outline', 'project description', 'project summary', 'describe the project', 'describe your project', 'proposal summary', 'overview of the project', 'descripcion del proyecto', 'about the project', 'problem the project', 'proposed solution', 'the problem'], profile: 'prof_project_outline' },
  { keys: ['sustainability goals', 'sustainable development', 'sdg', 'ods', 'objetivos de desarrollo'], profile: 'prof_sdg' },
  { keys: ['budget', 'presupuesto', 'total budget', 'project budget', 'requested amount', 'funding amount', 'grant amount', 'amount requested'], profile: 'prof_budget_total' },
  { keys: ['budget breakdown', 'desglose', 'how.*funds.*used', 'use of funds', 'budget detail', 'breakdown of costs'], profile: 'prof_budget_breakdown' },
  { keys: ['project timeline', 'timeline', 'cronograma', 'duration', 'project duration', 'implementation timeline', 'start date', 'milestones', 'key milestones', 'implementation plan', 'work plan'], profile: 'prof_milestones' },
  { keys: ['website', 'sitio web', 'org website', 'organization website', 'url'], profile: 'prof_website' },
  { keys: ['year founded', 'founded', 'ano de fundacion', 'year established', 'date established', 'when was.*founded'], profile: 'prof_year_founded' },
  { keys: ['mission', 'mision', 'organisation mission', 'organization mission', 'mission statement', 'about your org', 'about your organization', 'main activities'], profile: 'prof_mission' },
  { keys: ['thematic area', 'area tematica', 'sector', 'focus area', 'field of work', 'area of work', 'theme'], profile: 'prof_thematic_area' },
  { keys: ['beneficiar', 'target population', 'target group', 'who will benefit', 'community', 'direct beneficiaries', 'number of beneficiaries', 'people reached'], profile: 'prof_beneficiaries' },
  { keys: ['impact', 'impacto', 'measure impact', 'impact measurement', 'monitoring', 'evaluation', 'indicators', 'expected outcomes', 'expected results', 'how will you measure'], profile: 'prof_impact' },
  { keys: ['sustainability', 'sustentabilidad', 'sustainability plan', 'long-term', 'after the funding', 'beyond the grant', 'exit strategy'], profile: 'prof_sustainability' },
  { keys: ['amount requested', 'requested funding', 'funding requested', 'how much', 'grant size'], profile: 'prof_budget_requested' },
  { keys: ['start date', 'fecha de inicio', 'proposed start'], profile: 'prof_start_date' },
  { keys: ['end date', 'fecha de fin', 'proposed end', 'completion date'], profile: 'prof_end_date' },
  { keys: ['well positioned', 'why your org', 'capacity', 'experience', 'track record', 'organizational capacity', 'why is your', 'qualifications'], profile: 'prof_mission' },
];

function getGFormFields() {
  const fields = [];

  const containers = document.querySelectorAll('[data-params], .Qr7Oae, .geS5n, .freebirdFormviewerComponentsQuestionBaseRoot, .freebirdFormviewerViewNumberedItemContainer');

  const seen = new Set();

  containers.forEach(container => {
    const titleEl = container.querySelector('.M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle, [role="heading"], .freebirdFormviewerComponentsQuestionBaseHeader span');
    if (!titleEl) return;

    const label = titleEl.textContent.trim().replace(/\s*\*\s*$/, '');
    if (!label || seen.has(label)) return;
    seen.add(label);

    const input = container.querySelector('input[type="text"], input[type="email"], input[type="number"], input[type="url"], input[type="date"]');
    const textarea = container.querySelector('textarea');
    const contentEditable = container.querySelector('[contenteditable="true"]');
    const select = container.querySelector('[role="listbox"]');

    const element = textarea || contentEditable || input || null;
    const type = textarea ? 'textarea' : contentEditable ? 'contenteditable' : input ? 'input' : select ? 'select' : null;

    if (element || select) {
      fields.push({ label, element: element || select, type });
    }
  });

  if (fields.length === 0) {
    const allInputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
    allInputs.forEach(el => {
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel && !seen.has(ariaLabel)) {
        seen.add(ariaLabel);
        fields.push({ label: ariaLabel, element: el, type: el.tagName.toLowerCase() });
      }
    });
  }

  return fields;
}

function findProfileMatch(label) {
  const lower = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  for (const matcher of GFORM_MATCHERS) {
    for (const key of matcher.keys) {
      if (key.includes('.*')) {
        const regex = new RegExp(key, 'i');
        if (regex.test(lower)) return matcher.profile;
      } else if (lower.includes(key)) {
        return matcher.profile;
      }
    }
  }
  return null;
}

function setGFormValue(element, value) {
  if (!value || !element) return false;

  if (element.getAttribute('contenteditable') === 'true') {
    element.focus();
    element.innerHTML = '';
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    element.focus();

    const proto = element.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');

    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  return false;
}

function autofillGForm(profile) {
  const fields = getGFormFields();
  let filled = 0;
  const matched = [];
  const unmatched = [];

  fields.forEach(f => {
    const profileKey = findProfileMatch(f.label);
    if (profileKey && profile[profileKey]) {
      if (setGFormValue(f.element, String(profile[profileKey]))) {
        f.element.classList.add('grantfill-filled');
        setTimeout(() => f.element.classList.remove('grantfill-filled'), 2000);
        filled++;
        matched.push(f.label);
      } else {
        unmatched.push(f.label);
      }
    } else if (profileKey && !profile[profileKey]) {
      unmatched.push(`${f.label} (sin datos en perfil)`);
    } else {
      unmatched.push(f.label);
    }
  });

  return { filled, total: fields.length, matched, unmatched };
}

function scanGFormFields() {
  const fields = getGFormFields();
  return fields.map(f => ({
    id: '',
    name: '',
    label: f.label,
    type: f.type,
    tagName: f.type,
  }));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scan') {
    sendResponse({ fields: scanGFormFields() });
  } else if (request.action === 'autofill') {
    const result = autofillGForm(request.profile);
    sendResponse(result);
  } else if (request.action === 'autofill_from_banner') {
    chrome.storage.local.get(['grantfill_profile'], (res) => {
      const profile = res.grantfill_profile;
      if (profile && Object.keys(profile).length > 0) {
        const result = autofillGForm(profile);
        sendResponse(result);
      } else {
        sendResponse({ filled: 0, total: 0, matched: [], unmatched: [] });
      }
    });
    return true;
  } else if (request.action === 'clear') {
    const fields = getGFormFields();
    fields.forEach(f => setGFormValue(f.element, ''));
    sendResponse({ cleared: true });
  }
  return true;
});

function showGFormBanner() {
  const fields = getGFormFields();
  if (fields.length < 2) return;
  if (document.getElementById('grantfill-banner')) return;

  chrome.storage.local.get(['grantfill_profile', 'grantfill_user'], (result) => {
    const profile = result.grantfill_profile;
    const user = result.grantfill_user;
    const hasProfile = profile && Object.keys(profile).length > 0;

    const matchableCount = hasProfile
      ? fields.filter(f => {
          const pk = findProfileMatch(f.label);
          return pk && profile[pk];
        }).length
      : 0;

    const banner = document.createElement('div');
    banner.id = 'grantfill-banner';
    banner.innerHTML = `
      <div class="gfb-content">
        <div class="gfb-icon">⚡</div>
        <div class="gfb-text">
          <div class="gfb-title">GrantFill detectó ${fields.length} campos</div>
          <div class="gfb-sub">${hasProfile
            ? `<strong>${matchableCount}</strong> pueden completarse automaticamente como <strong>${user?.org_name || profile.prof_org_name || 'tu ONG'}</strong>. El resto queda para revision manual.`
            : 'Inicia sesion en GrantWell para sincronizar tus datos'
          }</div>
        </div>
        <div class="gfb-actions">
          ${hasProfile
            ? `<button id="gfb-autofill" class="gfb-btn-fill">Autocompletar (${matchableCount})</button>`
            : `<a href="https://grantwell-app.vercel.app" target="_blank" class="gfb-btn-fill">Ir a GrantWell</a>`
          }
          <button id="gfb-close" class="gfb-btn-close">✕</button>
        </div>
      </div>
      <div id="gfb-status" class="gfb-status" style="display:none;"></div>
    `;

    document.body.appendChild(banner);
    setTimeout(() => banner.classList.add('gfb-visible'), 100);

    document.getElementById('gfb-close').addEventListener('click', () => {
      banner.classList.remove('gfb-visible');
      setTimeout(() => banner.remove(), 300);
    });

    if (hasProfile && matchableCount > 0) {
      document.getElementById('gfb-autofill').addEventListener('click', () => {
        const res = autofillGForm(profile);
        const status = document.getElementById('gfb-status');
        if (!status) return;
        status.style.display = 'block';

        let html = '';
        if (res.filled > 0) {
          html += `<div class="gfb-status-success" style="padding:8px 0;">✅ ${res.filled} campos completados</div>`;
        }
        if (res.unmatched.length > 0) {
          html += `<div style="padding:6px 0; color:rgba(255,255,255,0.5); font-size:12px;">📝 Pendientes de revision manual: ${res.unmatched.slice(0, 5).join(', ')}${res.unmatched.length > 5 ? ` y ${res.unmatched.length - 5} más` : ''}</div>`;
        }
        status.innerHTML = html;
        status.className = 'gfb-status';
        status.style.padding = '10px 18px';
        status.style.borderTop = '1px solid rgba(255,255,255,0.08)';
      });
    }
  });
}

setTimeout(showGFormBanner, 2000);
