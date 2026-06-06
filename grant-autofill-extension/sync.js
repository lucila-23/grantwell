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

  fetch(`${API_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => r.json())
    .then(profile => {
      if (!profile.error) {
        const mapped = {
          prof_org_name: profile.org_name || user.org_name || '',
          prof_contact_name: profile.contact_name || user.contact_name || '',
          prof_contact_email: profile.email || user.email || '',
          prof_website: profile.website || '',
          prof_year_founded: profile.founded ? String(profile.founded) : '',
          prof_country: profile.country || '',
          prof_thematic_area: profile.area || '',
          prof_mission: profile.mission || '',
        };
        chrome.storage.local.set({ grantfill_profile: mapped });
      }
    })
    .catch(() => {});
}

syncFromApp();

const observer = new MutationObserver(() => {
  syncFromApp();
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('storage', (e) => {
  if (e.key === 'gw_token' || e.key === 'gw_user') {
    syncFromApp();
  }
});
