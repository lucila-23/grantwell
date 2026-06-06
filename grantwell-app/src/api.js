// Talks to the hakelton-api worker (../../api). Override with VITE_API_URL.
const API_URL = 'https://hakelton-api.marianojacobo.workers.dev'

export function getToken() {
  return localStorage.getItem('gw_token');
}

export function getUser() {
  const raw = localStorage.getItem('gw_user');
  return raw ? JSON.parse(raw) : null;
}

export function saveAuth(token, user) {
  localStorage.setItem('gw_token', token);
  localStorage.setItem('gw_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('gw_token');
  localStorage.removeItem('gw_user');
}

// Decode the payload of an HS256 JWT (header.payload.signature) without verifying.
function decodeJwt(token) {
  const part = token.split('.')[1];
  if (!part) throw new Error('malformed token');
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}

export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = decodeJwt(token);
    // JWT `exp` is in seconds since epoch.
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export async function login(email, password) {
  // The API returns { token, organization: { id, email } }.
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // Store token + minimal org first so getProfile() can authenticate, then
  // upgrade the stored user to the full profile (name, contact_name, …).
  saveAuth(data.token, data.organization);
  try {
    saveAuth(data.token, await getProfile());
  } catch {
    // Keep the minimal org if the profile fetch fails for any reason.
  }
  return data;
}

export async function register(email, password, org_name, contact_name) {
  // Registration creates the organization (no token), then we log in for one.
  await request('/organizations', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: org_name, contact_name }),
  });
  return login(email, password);
}

export async function getProfile() {
  const user = getUser();
  if (!user?.id) throw new Error('No hay sesion activa');
  return request(`/organizations/${user.id}`);
}

export async function updateProfile(profile) {
  const user = getUser();
  if (!user?.id) throw new Error('No hay sesion activa');
  return request(`/organizations/${user.id}`, {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
}

// Grant opportunities (scraped into grant_opportunity). Public, read-only.
// params: { q, sector, status, limit, offset }
export async function getGrants(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return request(`/grants${qs ? `?${qs}` : ''}`);
}

export async function getGrant(id) {
  return request(`/grants/${id}`);
}

// Apply to a grant opportunity. Creates a grant_application (status "Submitted")
// for the logged-in organization. Idempotent per (org, grant).
export async function createApplication(grantOpportunityId) {
  return request('/applications', {
    method: 'POST',
    body: JSON.stringify({ grant_opportunity_id: grantOpportunityId }),
  });
}

// Listing applications is not yet exposed by the hakelton-api; the UI falls
// back to mock data. Return an empty list so pages render cleanly until it lands.
export async function getApplications() {
  return [];
}
