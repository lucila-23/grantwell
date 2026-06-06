const GFORM_LABEL_PATTERNS = {
  'project name': 'prof_project_name',
  'organisation name': 'prof_org_name',
  'organization name': 'prof_org_name',
  'contact name': 'prof_contact_name',
  'contact details': 'prof_contact_email',
  'email': 'prof_contact_email',
  'country of implementation': 'prof_country',
  'country': 'prof_country',
  'project outline': 'prof_project_outline',
  'sustainability goals': 'prof_sdg',
  'sustainable development': 'prof_sdg',
  'budget': 'prof_budget_total',
  'project timeline': 'prof_milestones',
  'timeline': 'prof_milestones',
};

function getGFormFields() {
  const fields = [];
  const questionContainers = document.querySelectorAll('[data-params]');

  if (questionContainers.length === 0) {
    const containers = document.querySelectorAll('.Qr7Oae, .geS5n, .freebirdFormviewerComponentsQuestionBaseRoot');
    containers.forEach(container => {
      const titleEl = container.querySelector('.M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle, [role="heading"]');
      const input = container.querySelector('input[type="text"], textarea, [contenteditable="true"]');
      if (titleEl && input) {
        fields.push({
          label: titleEl.textContent.trim().replace(/\s*\*\s*$/, ''),
          element: input,
          type: input.tagName.toLowerCase(),
        });
      }
    });
    return fields;
  }

  questionContainers.forEach(container => {
    const titleEl = container.querySelector('.M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle, [role="heading"]');
    if (!titleEl) return;

    const label = titleEl.textContent.trim().replace(/\s*\*\s*$/, '');
    const input = container.querySelector('input[type="text"], input[type="email"], textarea, [contenteditable="true"]');
    const select = container.querySelector('[role="listbox"]');

    if (input) {
      fields.push({ label, element: input, type: input.tagName.toLowerCase() });
    } else if (select) {
      fields.push({ label, element: select, type: 'select' });
    }
  });

  return fields;
}

function findProfileMatch(label) {
  const lower = label.toLowerCase();
  for (const [pattern, profileKey] of Object.entries(GFORM_LABEL_PATTERNS)) {
    if (lower.includes(pattern)) return profileKey;
  }
  return null;
}

function setGFormValue(element, value) {
  if (!value || !element) return false;

  if (element.getAttribute('contenteditable') === 'true') {
    element.innerHTML = '';
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    element.focus();
    element.value = value;

    const nativeSetter = Object.getOwnPropertyDescriptor(
      element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype,
      'value'
    );
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(element, value);
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

  fields.forEach(f => {
    const profileKey = findProfileMatch(f.label);
    if (profileKey && profile[profileKey]) {
      if (setGFormValue(f.element, profile[profileKey])) {
        f.element.classList.add('grantfill-filled');
        setTimeout(() => f.element.classList.remove('grantfill-filled'), 2000);
        filled++;
      }
    }
  });

  return { filled, total: fields.length };
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
    const fields = scanGFormFields();
    sendResponse({ fields });
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
        sendResponse({ filled: 0, total: 0 });
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

    const banner = document.createElement('div');
    banner.id = 'grantfill-banner';
    banner.innerHTML = `
      <div class="gfb-content">
        <div class="gfb-icon">⚡</div>
        <div class="gfb-text">
          <div class="gfb-title">GrantFill detectó ${fields.length} campos</div>
          <div class="gfb-sub">${hasProfile
            ? `Conectado como <strong>${user?.org_name || profile.prof_org_name || 'tu ONG'}</strong>`
            : 'Inicia sesion en GrantWell para sincronizar'
          }</div>
        </div>
        <div class="gfb-actions">
          ${hasProfile
            ? `<button id="gfb-autofill" class="gfb-btn-fill">Autocompletar</button>`
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

    if (hasProfile) {
      document.getElementById('gfb-autofill').addEventListener('click', () => {
        const res = autofillGForm(profile);
        const status = document.getElementById('gfb-status');
        if (status) {
          status.style.display = 'block';
          if (res.filled > 0) {
            status.className = 'gfb-status gfb-status-success';
            status.textContent = `${res.filled} de ${res.total} campos completados`;
          } else {
            status.className = 'gfb-status gfb-status-error';
            status.textContent = 'No se encontraron coincidencias. Revisa tu perfil.';
          }
        }
      });
    }
  });
}

setTimeout(showGFormBanner, 2000);
