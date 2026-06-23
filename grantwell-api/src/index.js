import { runAllScrapers, scrapeGrantsGov, scrapeEUFunding, enrichGrantsGov } from './scrapers.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'grantwell-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function generateToken(userId, email) {
  const payload = { userId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return btoa(JSON.stringify(payload));
}

function verifyToken(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7)));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runAllScrapers(env.DB));
  },

  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const rawPath = url.pathname;
    const path = rawPath.startsWith('/api/') ? rawPath : `/api${rawPath}`;

    try {
      if ((path === '/api/auth/register' || path === '/api/organizations') && request.method === 'POST') {
        return register(request, env.DB);
      }
      if (path === '/api/auth/login' && request.method === 'POST') {
        return login(request, env.DB);
      }
      if (path === '/api/health') {
        return json({ status: 'ok', timestamp: new Date().toISOString() });
      }

      if (path === '/api/grants/filters' && request.method === 'GET') {
        return getGrantFilters(env.DB);
      }
      if (path === '/api/grants' && request.method === 'GET') {
        return listGrants(url, env.DB);
      }
      if (path.match(/^\/api\/grants\/\d+$/) && request.method === 'GET') {
        const id = path.split('/').pop();
        return getGrant(id, env.DB);
      }
      if (path === '/api/scrape' && request.method === 'POST') {
        const source = url.searchParams.get('source') || 'all';
        let scrapePromise;
        if (source === 'grants.gov') scrapePromise = scrapeGrantsGov(env.DB);
        else if (source === 'eu-funding') scrapePromise = scrapeEUFunding(env.DB);
        else if (source === 'enrich') scrapePromise = enrichGrantsGov(env.DB);
        else scrapePromise = runAllScrapers(env.DB);
        const results = await scrapePromise;
        return json({ message: 'Scraping complete', source, results });
      }

      const user = verifyToken(request);
      if (!user) {
        return json({ error: 'Unauthorized' }, 401);
      }

      if ((path === '/api/me' || path.match(/^\/api\/organizations\/\d+$/)) && request.method === 'GET') {
        return getProfile(user.userId, env.DB);
      }
      if ((path === '/api/me' && request.method === 'PUT') || (path.match(/^\/api\/organizations\/\d+$/) && request.method === 'PATCH')) {
        return updateProfile(user.userId, request, env.DB);
      }
      if (path === '/api/applications' && request.method === 'GET') {
        return getApplications(user.userId, env.DB);
      }
      if (path === '/api/applications' && request.method === 'POST') {
        return createApplication(user.userId, request, env.DB);
      }
      if (path.match(/^\/api\/applications\/\d+$/) && request.method === 'GET') {
        const id = path.split('/').pop();
        return getApplication(id, user.userId, env.DB);
      }
      if (path.match(/^\/api\/applications\/\d+\/status$/) && request.method === 'PUT') {
        const id = path.split('/')[3];
        return updateStatus(id, request, env.DB);
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

async function register(request, db) {
  const body = await request.json();
  const { email, password, contact_name } = body;
  const org_name = body.org_name || body.name;

  if (!email || !password || !org_name || !contact_name) {
    return json({ error: 'Todos los campos son obligatorios' }, 400);
  }

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return json({ error: 'El email ya esta registrado' }, 409);
  }

  const password_hash = await hashPassword(password);

  const result = await db.prepare(`
    INSERT INTO users (email, password_hash, org_name, contact_name)
    VALUES (?, ?, ?, ?)
  `).bind(email, password_hash, org_name, contact_name).run();

  const userId = result.meta.last_row_id;
  const token = generateToken(userId, email);

  return json({
    token,
    user: { id: userId, email, org_name, contact_name },
    organization: { id: userId, email, org_name, contact_name }
  }, 201);
}

async function login(request, db) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return json({ error: 'Email y password son obligatorios' }, 400);
  }

  const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    return json({ error: 'Credenciales invalidas' }, 401);
  }

  const password_hash = await hashPassword(password);
  if (password_hash !== user.password_hash) {
    return json({ error: 'Credenciales invalidas' }, 401);
  }

  const token = generateToken(user.id, user.email);

  const profile = {
    id: user.id, email: user.email, org_name: user.org_name,
    contact_name: user.contact_name, website: user.website,
    founded: user.founded, country: user.country,
    area: user.area, mission: user.mission,
  };

  return json({ token, user: profile, organization: profile });
}

async function getProfile(userId, db) {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return json({ error: 'Not found' }, 404);

  const { password_hash, ...profile } = user;
  return json(profile);
}

async function updateProfile(userId, request, db) {
  const body = await request.json();
  await db.prepare(`
    UPDATE users SET org_name = ?, contact_name = ?, website = ?,
    founded = ?, country = ?, area = ?, mission = ? WHERE id = ?
  `).bind(
    body.org_name, body.contact_name, body.website || null,
    body.founded || null, body.country || null,
    body.area || null, body.mission || null, userId
  ).run();

  return json({ message: 'Profile updated' });
}

async function getApplications(userId, db) {
  const apps = await db.prepare(`
    SELECT * FROM applications WHERE user_id = ? ORDER BY submitted_at DESC
  `).bind(userId).all();

  const results = [];
  for (const app of apps.results) {
    const events = await db.prepare(`
      SELECT * FROM timeline_events WHERE application_id = ? ORDER BY event_date ASC
    `).bind(app.id).all();
    results.push({ ...app, timeline: events.results });
  }

  return json(results);
}

async function getApplication(id, userId, db) {
  const app = await db.prepare(
    'SELECT * FROM applications WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();
  if (!app) return json({ error: 'Not found' }, 404);

  const events = await db.prepare(`
    SELECT * FROM timeline_events WHERE application_id = ? ORDER BY event_date ASC
  `).bind(id).all();

  return json({ ...app, timeline: events.results });
}

async function createApplication(userId, request, db) {
  const body = await request.json();

  const result = await db.prepare(`
    INSERT INTO applications (
      user_id, grant_name, funder, project_name, org_name, contact_name, contact_email,
      org_website, org_founded, org_mission, country, thematic_area,
      project_outline, sdg_alignment, budget_total, budget_requested,
      budget_breakdown, start_date, end_date, milestones,
      beneficiaries, impact_measurement, sustainability_plan, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
  `).bind(
    userId,
    body.grant_name || 'Collaborative Impact Partnership Grant',
    body.funder || 'Global Impact Alliance',
    body.project_name || '',
    body.org_name || '',
    body.contact_name || '',
    body.contact_email || '',
    body.org_website || null,
    body.org_founded || null,
    body.org_mission || null,
    body.country || null,
    body.thematic_area || null,
    body.project_outline || null,
    body.sdg_alignment || null,
    body.budget_total || null,
    body.budget_requested || null,
    body.budget_breakdown || null,
    body.start_date || null,
    body.end_date || null,
    body.milestones || null,
    body.beneficiaries || null,
    body.impact_measurement || null,
    body.sustainability_plan || null,
  ).run();

  const appId = result.meta.last_row_id;
  const today = new Date().toISOString().split('T')[0];

  await db.prepare(`
    INSERT INTO timeline_events (application_id, event, type, event_date)
    VALUES (?, 'Postulacion enviada', 'submitted', ?)
  `).bind(appId, today).run();

  return json({ id: appId, status: 'submitted', message: 'Application created' }, 201);
}

async function getGrantFilters(db) {
  const [categories, agencies, regions, budgetRange] = await Promise.all([
    db.prepare(`SELECT DISTINCT categories as val FROM grants WHERE categories IS NOT NULL AND categories != '' ORDER BY categories`).all(),
    db.prepare(`SELECT funder as val, COUNT(*) as cnt FROM grants WHERE funder IS NOT NULL GROUP BY funder HAVING cnt >= 2 ORDER BY cnt DESC`).all(),
    db.prepare(`SELECT DISTINCT region as val FROM grants WHERE region IS NOT NULL ORDER BY region`).all(),
    db.prepare(`SELECT MIN(amount_max) as min, MAX(amount_max) as max FROM grants WHERE amount_max IS NOT NULL`).first(),
  ]);

  const CATEGORY_MAP = {
    'Education': 'Education',
    'education': 'Education',
    'Health': 'Health',
    'health': 'Health',
    'Environment': 'Environment',
    'environment': 'Environment',
    'community': 'Community Development',
    'Community Development': 'Community Development',
    'nonprofit': 'Nonprofit',
    'Agriculture': 'Agriculture',
    'Science and Technology and other Research and Development': 'Science & Technology',
    'Arts': 'Arts & Culture',
    'Income Security and Social Services': 'Social Services',
    'Law, Justice and Legal Services': 'Law & Justice',
    'Disaster Prevention and Relief': 'Disaster Relief',
    'Food and Nutrition': 'Food & Nutrition',
    'Natural Resources': 'Natural Resources',
    'Business and Commerce': 'Business & Commerce',
    'Employment, Labor and Training': 'Employment & Training',
    'Housing': 'Housing',
  };

  const catSet = new Set();
  for (const r of (categories.results || [])) {
    const mapped = CATEGORY_MAP[r.val];
    if (mapped) catSet.add(mapped);
  }

  return json({
    categories: [...catSet].sort(),
    agencies: (agencies.results || []).map(r => r.val),
    regions: (regions.results || []).map(r => r.val),
    budget: { min: budgetRange?.min || 0, max: budgetRange?.max || 0 },
    sources: ['grants.gov', 'eu-funding'],
  });
}

async function listGrants(url, db) {
  const q = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || '';
  const source = url.searchParams.get('source') || '';
  const region = url.searchParams.get('region') || '';
  const category = url.searchParams.get('category') || '';
  const budgetMin = url.searchParams.get('budget_min') || '';
  const budgetMax = url.searchParams.get('budget_max') || '';
  const deadlineFrom = url.searchParams.get('deadline_from') || '';
  const deadlineTo = url.searchParams.get('deadline_to') || '';
  const sortBy = url.searchParams.get('sort') || 'deadline';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '60'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let where = ['1=1'];
  let binds = [];

  if (q) {
    where.push('(title LIKE ? OR agency LIKE ? OR categories LIKE ? OR description LIKE ? OR funder LIKE ?)');
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('status = ?');
    binds.push(status);
  }
  if (source) {
    where.push('source = ?');
    binds.push(source);
  }
  if (region) {
    where.push('region = ?');
    binds.push(region);
  }
  if (category) {
    where.push('categories LIKE ?');
    binds.push(`%${category}%`);
  }
  if (budgetMin) {
    where.push('amount_max >= ?');
    binds.push(parseFloat(budgetMin));
  }
  if (budgetMax) {
    where.push('amount_max <= ?');
    binds.push(parseFloat(budgetMax));
  }
  if (deadlineFrom) {
    where.push('deadline >= ?');
    binds.push(deadlineFrom);
  }
  if (deadlineTo) {
    where.push('deadline <= ?');
    binds.push(deadlineTo);
  }

  const orderClauses = {
    deadline: 'deadline ASC NULLS LAST',
    budget_desc: 'amount_max DESC NULLS LAST',
    budget_asc: 'amount_max ASC NULLS LAST',
    newest: 'scraped_at DESC',
    name: 'title ASC',
  };
  const orderBy = orderClauses[sortBy] || orderClauses.deadline;

  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM grants WHERE ${where.join(' AND ')}`
  ).bind(...binds).first();

  const rows = await db.prepare(
    `SELECT * FROM grants WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all();

  const items = (rows.results || []).map(g => ({
    id: g.id,
    name: g.title,
    donors: g.funder,
    sector: g.categories,
    status: g.status,
    deadline: g.deadline,
    location_names: [g.country, g.region].filter(Boolean).join(', '),
    budget: g.amount_max,
    budget_min: g.amount_min,
    currency: g.currency,
    url: g.url,
    source: g.source,
    agency: g.agency,
    open_date: g.open_date,
    description: g.description,
    eligibility: g.eligibility,
  }));

  return json({ items, total: countResult?.total || 0 });
}

async function getGrant(id, db) {
  const g = await db.prepare('SELECT * FROM grants WHERE id = ?').bind(id).first();
  if (!g) return json({ error: 'Not found' }, 404);
  return json({
    id: g.id,
    name: g.title,
    donors: g.funder,
    sector: g.categories,
    status: g.status,
    deadline: g.deadline,
    location_names: [g.country, g.region].filter(Boolean).join(', '),
    budget: g.amount_max,
    currency: g.currency,
    url: g.url,
    source: g.source,
    agency: g.agency,
    open_date: g.open_date,
    description: g.description,
    eligibility: g.eligibility,
    raw_data: g.raw_data,
  });
}

async function updateStatus(id, request, db) {
  const body = await request.json();
  const { status, event, event_type } = body;

  await db.prepare(`
    UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(status, id).run();

  if (event) {
    const today = new Date().toISOString().split('T')[0];
    await db.prepare(`
      INSERT INTO timeline_events (application_id, event, type, event_date)
      VALUES (?, ?, ?, ?)
    `).bind(id, event, event_type || status, today).run();
  }

  return json({ id, status, message: 'Status updated' });
}
