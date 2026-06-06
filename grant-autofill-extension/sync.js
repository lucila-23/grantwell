// POLEN API — syncs profile from the web app to the extension
const API_URL = 'https://grantwell-api.lucilaprieto8.workers.dev';

function syncFromApp() {
  const token = localStorage.getItem('gw_token');
  const userRaw = localStorage.getItem('gw_user');

  if (!token || !userRaw) return;

  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return;
  } catch {
    return;
  }

  const user = JSON.parse(userRaw);

  chrome.storage.local.set({
    grantfill_token: token,
    grantfill_user: user,
  });

  chrome.storage.local.get(['grantfill_profile'], (existing) => {
    const prev = existing.grantfill_profile || {};

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(profile => {
        if (!profile.error) {
          const apiData = {
            prof_org_name: profile.org_name || user.org_name || '',
            prof_contact_name: profile.contact_name || user.contact_name || '',
            prof_contact_email: profile.email || user.email || '',
            prof_website: profile.website || '',
            prof_year_founded: profile.founded ? String(profile.founded) : '',
            prof_country: profile.country || 'Argentina',
            prof_thematic_area: profile.area || 'education',
            prof_mission: profile.mission || 'Fundacion Raices Urbanas trabaja para cerrar la brecha educativa en comunidades urbanas vulnerables de Argentina. A traves de programas de aprendizaje basados en tecnologia y redes de mentoria comunitaria, empoderamos a jovenes de 14 a 24 anos con habilidades digitales, pensamiento critico y capacidades de liderazgo.',
            prof_project_name: prev.prof_project_name || 'Digital Bridges: Tech Skills for Youth Employment',
            prof_project_outline: prev.prof_project_outline || 'In Argentina, youth unemployment reaches 25% in low-income urban areas. Digital Bridges addresses this gap by providing intensive 6-month digital skills bootcamps in three cities targeting 500 young people aged 16-24 from underserved communities. The program combines technical training with soft skills workshops and paid internship placements with local tech companies. Our established partnerships with 15 tech companies, 8 community centers, and 3 municipal governments position us to scale effectively.',
            prof_sdg: prev.prof_sdg || 'SDG 4 (Quality Education): Direct provision of accessible digital skills training. SDG 8 (Decent Work): Creating employment pathways through industry-aligned curricula. SDG 10 (Reduced Inequalities): Targeting underserved communities to close the digital divide.',
            prof_budget_total: prev.prof_budget_total || '50000',
            prof_budget_requested: prev.prof_budget_requested || '45000',
            prof_budget_breakdown: prev.prof_budget_breakdown || 'Personnel: 40%, Equipment: 20%, Training materials: 15%, Internship stipends: 15%, Admin: 10%',
            prof_start_date: prev.prof_start_date || 'September 2026',
            prof_end_date: prev.prof_end_date || 'August 2027',
            prof_milestones: prev.prof_milestones || '1. Participant selection — Month 2\n2. First bootcamp launched — Month 3\n3. Mid-program evaluation — Month 6\n4. Internship placements — Month 7\n5. Final impact report — Month 12',
            prof_beneficiaries: prev.prof_beneficiaries || '500',
            prof_impact: prev.prof_impact || 'We will track enrollment/completion rates, skills assessment scores, employment placement rate within 3 months, and income changes at 6/12 months post-program via quarterly reports.',
            prof_sustainability: prev.prof_sustainability || 'Revenue-sharing with employer partners, train-the-trainer model reducing costs 30% annually, and municipal co-funding commitments for 2027-2028. Projected 60% self-funding by Year 2.',
          };
          const merged = { ...prev };
          for (const [key, val] of Object.entries(apiData)) {
            if (val) merged[key] = val;
          }
          chrome.storage.local.set({ grantfill_profile: merged });
        }
      })
      .catch(() => {});
  });
}

function syncDocs() {
  const raw = localStorage.getItem('gw_docs');
  if (!raw) return;
  try {
    const docs = JSON.parse(raw).map(d => ({
      key: d.key,
      label: d.label,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      data: d.data,
    }));
    chrome.storage.local.set({ grantfill_docs: docs });
  } catch {}
}

syncFromApp();
syncDocs();

const observer = new MutationObserver(() => {
  syncFromApp();
  syncDocs();
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('storage', (e) => {
  if (e.key === 'gw_token' || e.key === 'gw_user') {
    syncFromApp();
  }
});
