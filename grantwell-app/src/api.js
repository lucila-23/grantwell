const API_URL = 'https://grantwell-api.lucilaprieto8.workers.dev';

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

export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
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
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveAuth(data.token, data.user);
  return data;
}

export async function register(email, password, org_name, contact_name) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, org_name, contact_name }),
  });
  saveAuth(data.token, data.user);
  return data;
}

export async function getProfile() {
  return request('/api/me');
}

export async function updateProfile(profile) {
  return request('/api/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function getApplications() {
  return request('/api/applications');
}

export async function createApplication(appData) {
  return request('/api/applications', {
    method: 'POST',
    body: JSON.stringify(appData),
  });
}

export async function getApplication(id) {
  return request(`/api/applications/${id}`);
}
