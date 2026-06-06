const PROFILE_FIELDS = [
  'prof_org_name', 'prof_contact_name', 'prof_contact_email',
  'prof_website', 'prof_year_founded', 'prof_country', 'prof_thematic_area',
  'prof_mission', 'prof_project_name', 'prof_project_outline', 'prof_sdg',
  'prof_budget_total', 'prof_budget_requested', 'prof_budget_breakdown',
  'prof_start_date', 'prof_end_date', 'prof_milestones',
  'prof_beneficiaries', 'prof_impact', 'prof_sustainability'
];

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

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadProfile();
  scanPage();

  document.getElementById('btnSaveProfile').addEventListener('click', saveProfile);
  document.getElementById('btnAutofill').addEventListener('click', runAutofill);
  document.getElementById('btnClear').addEventListener('click', clearFields);
});

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

function loadProfile() {
  chrome.storage.local.get(['grantfill_profile'], (result) => {
    const profile = result.grantfill_profile;
    if (!profile) return;

    PROFILE_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && profile[id]) el.value = profile[id];
    });

    document.getElementById('profileBadge').style.display = 'inline-block';
  });
}

function saveProfile() {
  const profile = {};
  let filled = 0;

  PROFILE_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) {
      profile[id] = el.value;
      filled++;
    }
  });

  chrome.storage.local.set({ grantfill_profile: profile }, () => {
    const status = document.getElementById('saveStatus');
    status.className = 'status success';
    status.textContent = `Profile saved! ${filled} fields stored.`;
    document.getElementById('profileBadge').style.display = 'inline-block';
    setTimeout(() => { status.className = 'status'; }, 3000);
  });
}

function scanPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'scan' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        document.getElementById('scanStatus').style.display = 'none';
        document.getElementById('noFields').style.display = 'block';
        return;
      }

      const fields = response.fields || [];
      document.getElementById('scanStatus').style.display = 'none';

      if (fields.length === 0) {
        document.getElementById('noFields').style.display = 'block';
        return;
      }

      document.getElementById('fieldsFound').style.display = 'block';
      renderDetectedFields(fields);
    });
  });
}

function renderDetectedFields(fields) {
  const container = document.getElementById('detectedFields');
  container.innerHTML = '';

  chrome.storage.local.get(['grantfill_profile'], (result) => {
    const profile = result.grantfill_profile || {};

    fields.forEach(f => {
      const profileKey = findProfileMatch(f);
      const hasValue = profileKey && profile[profileKey];

      const div = document.createElement('div');
      div.className = 'detected-field';
      div.innerHTML = `
        <span class="field-name">${f.label || f.name || f.id}</span>
        ${hasValue
          ? `<span class="field-match">✓ Match</span>`
          : `<span class="field-no-match">No match</span>`
        }
      `;
      container.appendChild(div);
    });

    const matched = fields.filter(f => {
      const pk = findProfileMatch(f);
      return pk && profile[pk];
    }).length;

    if (matched === 0) {
      const status = document.getElementById('autofillStatus');
      status.className = 'status info';
      status.textContent = 'Save your profile first to enable autofill.';
    }
  });
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

function runAutofill() {
  chrome.storage.local.get(['grantfill_profile'], (result) => {
    const profile = result.grantfill_profile;
    if (!profile || Object.keys(profile).length === 0) {
      const status = document.getElementById('autofillStatus');
      status.className = 'status error';
      status.textContent = 'No profile saved. Go to "My Profile" tab and save your data first.';
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'autofill',
        profile: profile,
        fieldMap: FIELD_MAP,
        labelPatterns: LABEL_PATTERNS
      }, (response) => {
        const status = document.getElementById('autofillStatus');
        if (response && response.filled > 0) {
          status.className = 'status success';
          status.textContent = `Filled ${response.filled} of ${response.total} fields successfully!`;
        } else {
          status.className = 'status error';
          status.textContent = 'Could not fill any fields. Check your profile data.';
        }
      });
    });
  });
}

function clearFields() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'clear' }, (response) => {
      const status = document.getElementById('autofillStatus');
      status.className = 'status info';
      status.textContent = 'All form fields cleared.';
      setTimeout(() => { status.className = 'status'; }, 2000);
    });
  });
}
