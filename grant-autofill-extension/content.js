const FIELD_MAP = {
  'org_name': 'prof_org_name',
  'organisation_name': 'prof_org_name',
  'organization_name': 'prof_org_name',
  'contact_name': 'prof_contact_name',
  'contact_email': 'prof_contact_email',
  'email': 'prof_contact_email',
  'org_website': 'prof_website',
  'website': 'prof_website',
  'org_founded': 'prof_year_founded',
  'year_founded': 'prof_year_founded',
  'country': 'prof_country',
  'thematic_area': 'prof_thematic_area',
  'org_mission': 'prof_mission',
  'mission': 'prof_mission',
  'project_name': 'prof_project_name',
  'project_outline': 'prof_project_outline',
  'project_description': 'prof_project_outline',
  'sdg_alignment': 'prof_sdg',
  'sdg': 'prof_sdg',
  'budget_total': 'prof_budget_total',
  'budget': 'prof_budget_total',
  'budget_requested': 'prof_budget_requested',
  'amount_requested': 'prof_budget_requested',
  'budget_breakdown': 'prof_budget_breakdown',
  'start_date': 'prof_start_date',
  'end_date': 'prof_end_date',
  'project_milestones': 'prof_milestones',
  'milestones': 'prof_milestones',
  'beneficiaries': 'prof_beneficiaries',
  'impact_measurement': 'prof_impact',
  'impact': 'prof_impact',
  'sustainability_plan': 'prof_sustainability',
  'sustainability': 'prof_sustainability'
};

const LABEL_PATTERNS = {
  'organisation name': 'prof_org_name',
  'organization name': 'prof_org_name',
  'org name': 'prof_org_name',
  'contact name': 'prof_contact_name',
  'contact details': 'prof_contact_email',
  'contact email': 'prof_contact_email',
  'email address': 'prof_contact_email',
  'website': 'prof_website',
  'year founded': 'prof_year_founded',
  'country of implementation': 'prof_country',
  'country': 'prof_country',
  'thematic area': 'prof_thematic_area',
  'mission': 'prof_mission',
  'organisation mission': 'prof_mission',
  'project name': 'prof_project_name',
  'project outline': 'prof_project_outline',
  'project description': 'prof_project_outline',
  'sustainable development goals': 'prof_sdg',
  'sdg': 'prof_sdg',
  'total budget': 'prof_budget_total',
  'budget': 'prof_budget_total',
  'amount requested': 'prof_budget_requested',
  'budget breakdown': 'prof_budget_breakdown',
  'start date': 'prof_start_date',
  'end date': 'prof_end_date',
  'milestones': 'prof_milestones',
  'key milestones': 'prof_milestones',
  'project timeline': 'prof_milestones',
  'beneficiaries': 'prof_beneficiaries',
  'number of direct beneficiaries': 'prof_beneficiaries',
  'impact measurement': 'prof_impact',
  'measure impact': 'prof_impact',
  'sustainability plan': 'prof_sustainability',
  'sustainability': 'prof_sustainability'
};

function getFormFields() {
  const fields = [];
  const inputs = document.querySelectorAll('input, textarea, select');

  inputs.forEach(el => {
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
    if (el.offsetParent === null) return;

    const label = findLabel(el);
    fields.push({
      id: el.id || '',
      name: el.name || '',
      type: el.type || el.tagName.toLowerCase(),
      label: label,
      tagName: el.tagName.toLowerCase()
    });
  });

  return fields;
}

function findLabel(el) {
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return label.textContent.trim().replace(/\s*\*\s*$/, '');
  }

  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const label = parent.querySelector('label');
    if (label && parent.querySelectorAll('input, textarea, select').length === 1) {
      return label.textContent.trim().replace(/\s*\*\s*$/, '');
    }
    parent = parent.parentElement;
  }

  if (el.placeholder) return el.placeholder;
  if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');

  return '';
}

function findProfileMatch(field) {
  const id = (field.id || '').toLowerCase();
  const name = (field.name || '').toLowerCase();
  const label = (field.label || '').toLowerCase();

  if (FIELD_MAP[id]) return FIELD_MAP[id];
  if (FIELD_MAP[name]) return FIELD_MAP[name];

  for (const [pattern, profileKey] of Object.entries(LABEL_PATTERNS)) {
    if (label.includes(pattern)) return profileKey;
  }

  for (const [key, profileKey] of Object.entries(FIELD_MAP)) {
    if (id.includes(key) || name.includes(key)) return profileKey;
  }

  return null;
}

function setFieldValue(el, value) {
  if (!value) return false;

  if (el.tagName === 'SELECT') {
    const options = Array.from(el.options);
    const matchIdx = options.findIndex(o =>
      o.value.toLowerCase() === value.toLowerCase() ||
      o.textContent.toLowerCase().includes(value.toLowerCase()) ||
      value.toLowerCase().includes(o.value.toLowerCase())
    );
    if (matchIdx >= 0) {
      el.selectedIndex = matchIdx;
      el.options[matchIdx].selected = true;
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.classList.add('grantfill-filled');
      setTimeout(() => el.classList.remove('grantfill-filled'), 2000);
      return true;
    }
    return false;
  }

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
    'value'
  );

  if (nativeInputValueSetter && nativeInputValueSetter.set) {
    nativeInputValueSetter.set.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  el.classList.add('grantfill-filled');
  setTimeout(() => el.classList.remove('grantfill-filled'), 2000);

  return true;
}

function autofillForm(profile) {
  const inputs = document.querySelectorAll('input, textarea, select');
  let filled = 0;
  let total = 0;

  inputs.forEach(el => {
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
    if (el.offsetParent === null) return;

    total++;

    const fieldInfo = {
      id: el.id || '',
      name: el.name || '',
      label: findLabel(el)
    };

    const profileKey = findProfileMatch(fieldInfo);
    if (profileKey && profile[profileKey]) {
      if (setFieldValue(el, profile[profileKey])) {
        filled++;
      }
    }
  });

  return { filled, total };
}

function clearForm() {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(el => {
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scan') {
    const fields = getFormFields();
    sendResponse({ fields });
  } else if (request.action === 'autofill') {
    const result = autofillForm(request.profile);
    sendResponse(result);
  } else if (request.action === 'clear') {
    clearForm();
    sendResponse({ cleared: true });
  } else if (request.action === 'autofill_from_banner') {
    chrome.storage.local.get(['grantfill_profile'], (result) => {
      const profile = result.grantfill_profile;
      if (profile && Object.keys(profile).length > 0) {
        const res = autofillForm(profile);
        updateBannerStatus(res.filled, res.total);
        sendResponse(res);
      } else {
        sendResponse({ filled: 0, total: 0 });
      }
    });
    return true;
  }
  return true;
});

function countMatchableFields(profile) {
  const inputs = document.querySelectorAll('input, textarea, select');
  let matchable = 0;
  let total = 0;
  const unmatchedLabels = [];

  inputs.forEach(el => {
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
    if (el.offsetParent === null) return;
    total++;

    const fieldInfo = { id: el.id || '', name: el.name || '', label: findLabel(el) };
    const profileKey = findProfileMatch(fieldInfo);
    if (profileKey && profile[profileKey]) {
      matchable++;
    } else {
      const label = fieldInfo.label || fieldInfo.name || fieldInfo.id;
      if (label) unmatchedLabels.push(label);
    }
  });

  return { matchable, total, unmatchedLabels };
}

function autofillFormDetailed(profile) {
  const inputs = document.querySelectorAll('input, textarea, select');
  let filled = 0;
  let total = 0;
  const matched = [];
  const unmatched = [];

  inputs.forEach(el => {
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
    if (el.offsetParent === null) return;
    total++;

    const fieldInfo = { id: el.id || '', name: el.name || '', label: findLabel(el) };
    const displayLabel = fieldInfo.label || fieldInfo.name || fieldInfo.id;
    const profileKey = findProfileMatch(fieldInfo);

    if (profileKey && profile[profileKey]) {
      if (setFieldValue(el, profile[profileKey])) {
        filled++;
        matched.push(displayLabel);
      } else {
        unmatched.push(displayLabel);
      }
    } else {
      unmatched.push(displayLabel);
    }
  });

  return { filled, total, matched, unmatched };
}

function showGrantFillBanner() {
  const inputs = document.querySelectorAll('input, textarea, select');
  const formFieldCount = Array.from(inputs).filter(el =>
    el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'button' && el.offsetParent !== null
  ).length;

  if (formFieldCount < 3) return;
  if (document.getElementById('grantfill-banner')) return;

  chrome.storage.local.get(['grantfill_profile', 'grantfill_user'], (result) => {
    const profile = result.grantfill_profile;
    const user = result.grantfill_user;
    const hasProfile = profile && Object.keys(profile).length > 0;

    const info = hasProfile ? countMatchableFields(profile) : { matchable: 0, total: formFieldCount, unmatchedLabels: [] };

    const banner = document.createElement('div');
    banner.id = 'grantfill-banner';
    banner.innerHTML = `
      <div class="gfb-content">
        <div class="gfb-icon">⚡</div>
        <div class="gfb-text">
          <div class="gfb-title">PolenFill detectó ${formFieldCount} campos</div>
          <div class="gfb-sub">${hasProfile
            ? `<strong>${info.matchable}</strong> pueden completarse automaticamente como <strong>${user?.org_name || profile.prof_org_name || 'tu ONG'}</strong>. El resto queda para revision manual.`
            : 'Inicia sesion en POLEN para sincronizar tus datos'
          }</div>
        </div>
        <div class="gfb-actions">
          ${hasProfile && info.matchable > 0
            ? `<button id="gfb-autofill" class="gfb-btn-fill">Autocompletar (${info.matchable})</button>`
            : hasProfile
              ? `<span style="color:rgba(255,255,255,0.4);font-size:12px;">Completa tu perfil para autocompletar</span>`
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

    const autofillBtn = document.getElementById('gfb-autofill');
    if (autofillBtn && hasProfile) {
      autofillBtn.addEventListener('click', () => {
        const res = autofillFormDetailed(profile);
        const status = document.getElementById('gfb-status');
        if (!status) return;
        status.style.display = 'block';
        status.className = 'gfb-status gfb-status-success';
        const pending = res.total - res.filled;
        status.textContent = `✅ ${res.filled} completados` + (pending > 0 ? ` · ${pending} pendientes de revision` : '');
      });
    }
  });
}

function detectFileInputs() {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  if (fileInputs.length === 0) return;

  chrome.storage.local.get(['grantfill_docs'], (result) => {
    const docs = result.grantfill_docs;
    if (!docs || docs.length === 0) return;

    fileInputs.forEach(input => {
      if (input.dataset.grantfillDone) return;
      input.dataset.grantfillDone = 'true';

      const wrapper = input.closest('.form-group, .field, div') || input.parentElement;

      const popover = document.createElement('div');
      popover.className = 'gf-file-popover';
      popover.innerHTML = `
        <div class="gf-fp-header">
          <span class="gf-fp-icon">📎</span>
          <span>Documentos precargados en POLEN</span>
          <span class="gf-fp-header-actions">
            <button class="gf-fp-close" title="Cerrar">✕</button>
          </span>
        </div>
        <div class="gf-fp-list">
          ${docs.map((d, i) => `
            <button class="gf-fp-item" data-idx="${i}">
              <span class="gf-fp-item-icon">${d.fileType.includes('pdf') ? '📕' : '📘'}</span>
              <span class="gf-fp-item-info">
                <span class="gf-fp-item-label">${d.label}</span>
                <span class="gf-fp-item-file">${d.fileName}</span>
              </span>
            </button>
          `).join('')}
        </div>
      `;

      wrapper.style.position = 'relative';
      wrapper.appendChild(popover);

      popover.querySelector('.gf-fp-close').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        popover.remove();
      });

      popover.querySelectorAll('.gf-fp-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const idx = parseInt(btn.dataset.idx);
          const doc = docs[idx];
          if (!doc || !doc.data) return;

          try {
            const byteString = atob(doc.data.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const file = new File([ab], doc.fileName, { type: doc.fileType });
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));

            btn.innerHTML = `
              <span class="gf-fp-item-icon">✅</span>
              <span class="gf-fp-item-info">
                <span class="gf-fp-item-label">${doc.label}</span>
                <span class="gf-fp-item-file" style="color:#16a34a;">Adjuntado correctamente</span>
              </span>
            `;
          } catch (err) {
            btn.querySelector('.gf-fp-item-file').textContent = 'Error al adjuntar';
          }
        });
      });
    });
  });
}

const isGoogleForm = window.location.hostname === 'docs.google.com' && window.location.pathname.startsWith('/forms');
if (!isGoogleForm) {
  setTimeout(showGrantFillBanner, 1500);
  setTimeout(detectFileInputs, 2000);
}
