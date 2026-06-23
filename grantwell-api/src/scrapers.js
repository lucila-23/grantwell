const GRANTS_GOV_URL = 'https://apply07.grants.gov/grantsws/rest/opportunities/search/';
const GRANTS_GOV_DETAIL_URL = 'https://apply07.grants.gov/grantsws/rest/opportunity/details';
const EU_FUNDING_URL = 'https://api.tech.ec.europa.eu/search-api/prod/rest/search';

const STATUS_MAP_GRANTS_GOV = {
  posted: 'open',
  forecasted: 'forecast',
  closed: 'closed',
  archived: 'closed',
};

export async function scrapeGrantsGov(db) {
  const log = await startLog(db, 'grants.gov');
  try {
    const keywords = ['nonprofit', 'education', 'health'];
    const allGrants = [];

    for (const keyword of keywords) {
      const res = await fetch(GRANTS_GOV_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          oppStatuses: 'posted|forecasted',
          rows: 50,
          sortBy: 'openDate|desc',
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const opp of (data.oppHits || [])) {
        allGrants.push({
          source: 'grants.gov',
          source_id: String(opp.id),
          title: opp.title,
          agency: opp.agencyCode || opp.agency,
          funder: opp.agency || opp.agencyCode,
          status: STATUS_MAP_GRANTS_GOV[opp.oppStatus?.toLowerCase()] || 'open',
          open_date: opp.openDate || null,
          deadline: opp.closeDate || null,
          categories: keyword,
          url: `https://www.grants.gov/search-results-detail/${opp.id}`,
          description: opp.description || null,
          country: 'US',
          region: 'North America',
          currency: 'USD',
          amount_max: null,
        });
      }
    }

    const { newCount, updatedCount } = await batchUpsert(db, allGrants);
    await finishLog(db, log.id, allGrants.length, newCount, updatedCount, 'done');
    return { found: allGrants.length, new: newCount, updated: updatedCount };
  } catch (err) {
    await finishLog(db, log.id, 0, 0, 0, 'error', err.message);
    throw err;
  }
}

export async function scrapeEUFunding(db) {
  const log = await startLog(db, 'eu-funding');
  try {
    const allGrants = [];
    const queries = ['grant NGO', 'civil society funding'];

    for (const query of queries) {
      const params = new URLSearchParams({
        apiKey: 'SEDIA',
        text: query,
        pageSize: '50',
        pageNumber: '1',
      });

      const res = await fetch(`${EU_FUNDING_URL}?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) continue;
      const data = await res.json();

      for (const item of (data.results || [])) {
        const meta = item.metadata || {};
        const lang = Array.isArray(meta.language) ? meta.language[0] : meta.language;
        if (lang && lang !== 'en') continue;

        let budget = null;
        if (meta.budgetOverview) {
          try {
            const bo = JSON.parse(meta.budgetOverview);
            const values = Object.values(bo).flatMap(v =>
              typeof v === 'object' ? Object.values(v) : [v]
            ).filter(n => typeof n === 'number');
            budget = values.length ? Math.max(...values) : null;
          } catch {}
        }

        const statusCode = meta.sortStatus;
        let status = 'open';
        if (statusCode >= 31094504) status = 'closed';
        else if (statusCode === 31094501) status = 'forecast';

        allGrants.push({
          source: 'eu-funding',
          source_id: (Array.isArray(meta.identifier) ? meta.identifier[0] : meta.identifier) || item.reference || `eu-${allGrants.length}`,
          title: (Array.isArray(meta.title) ? meta.title[0] : meta.title) || item.summary || item.title || 'EU Funding Opportunity',
          agency: (Array.isArray(meta.frameworkProgramme) ? meta.frameworkProgramme[0] : meta.frameworkProgramme) || 'European Commission',
          funder: 'European Union',
          status,
          open_date: extractDate(meta.startDate),
          deadline: extractDate(meta.deadlineDate),
          amount_max: budget,
          currency: 'EUR',
          categories: (Array.isArray(meta.keywords) ? meta.keywords : []).flat().slice(0, 5).join(', '),
          url: unwrap(meta.url) || unwrap(item.url) || null,
          description: unwrap(item.summary) || null,
          country: 'EU',
          region: 'Europe',
        });
      }
    }

    const { newCount, updatedCount } = await batchUpsert(db, allGrants);
    await finishLog(db, log.id, allGrants.length, newCount, updatedCount, 'done');
    return { found: allGrants.length, new: newCount, updated: updatedCount };
  } catch (err) {
    await finishLog(db, log.id, 0, 0, 0, 'error', err.message);
    throw err;
  }
}

export async function enrichGrantsGov(db) {
  const rows = await db.prepare(
    `SELECT id, source_id FROM grants WHERE source = 'grants.gov' AND description IS NULL LIMIT 15`
  ).all();
  const toEnrich = rows.results || [];
  if (!toEnrich.length) return { enriched: 0 };

  let enriched = 0;
  for (const row of toEnrich) {
    try {
      const res = await fetch(GRANTS_GOV_DETAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `oppId=${row.source_id}`,
      });
      if (!res.ok) continue;
      const detail = await res.json();
      const syn = detail.synopsis || {};

      const desc = syn.synopsisDesc || null;
      const ceiling = parseFloat(syn.awardCeiling) || null;
      const floor = parseFloat(syn.awardFloor) || null;
      const eligibility = syn.applicantEligibilityDesc || null;
      const applicantTypes = (syn.applicantTypes || []).map(t => t.description).join(', ') || null;
      const fundingCats = (syn.fundingActivityCategories || []).map(c => c.description).join(', ') || null;
      const agencyName = syn.agencyName || null;

      await db.prepare(`
        UPDATE grants SET
          description = ?,
          amount_max = COALESCE(?, amount_max),
          amount_min = ?,
          eligibility = COALESCE(?, ?),
          categories = COALESCE(?, categories),
          funder = COALESCE(?, funder),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        desc, ceiling, floor,
        eligibility, applicantTypes,
        fundingCats, agencyName,
        row.id
      ).run();
      enriched++;
    } catch {}
  }
  return { enriched, total: toEnrich.length };
}

export async function runAllScrapers(db) {
  const results = {};
  try { results.grantsGov = await scrapeGrantsGov(db); } catch (e) { results.grantsGov = { error: e.message }; }
  try { results.euFunding = await scrapeEUFunding(db); } catch (e) { results.euFunding = { error: e.message }; }
  try { results.enrichment = await enrichGrantsGov(db); } catch (e) { results.enrichment = { error: e.message }; }
  return results;
}

async function batchUpsert(db, grants) {
  let newCount = 0, updatedCount = 0;

  const sourceIds = [...new Set(grants.map(g => `${g.source}:${g.source_id}`))];
  const uniqueGrants = [];
  const seen = new Set();
  for (const g of grants) {
    const key = `${g.source}:${g.source_id}`;
    if (!seen.has(key)) { seen.add(key); uniqueGrants.push(g); }
  }

  const existing = new Set();
  const CHUNK = 30;
  for (let i = 0; i < uniqueGrants.length; i += CHUNK) {
    const chunk = uniqueGrants.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => '(?, ?)').join(', ');
    const binds = chunk.flatMap(g => [g.source, g.source_id]);
    const rows = await db.prepare(
      `SELECT source, source_id FROM grants WHERE (source, source_id) IN (VALUES ${placeholders})`
    ).bind(...binds).all();
    for (const r of (rows.results || [])) {
      existing.add(`${r.source}:${r.source_id}`);
    }
  }

  const stmts = [];
  for (const g of uniqueGrants) {
    const key = `${g.source}:${g.source_id}`;
    if (existing.has(key)) {
      stmts.push(
        db.prepare(`
          UPDATE grants SET title=?, funder=?, agency=?, status=?,
            open_date=?, deadline=?, amount_max=?, currency=?,
            categories=?, url=?, description=?, country=?, region=?,
            updated_at=datetime('now')
          WHERE source=? AND source_id=?
        `).bind(
          g.title, g.funder, g.agency, g.status,
          g.open_date, g.deadline, g.amount_max, g.currency || 'USD',
          g.categories, g.url, g.description, g.country, g.region,
          g.source, g.source_id
        )
      );
      updatedCount++;
    } else {
      stmts.push(
        db.prepare(`
          INSERT INTO grants (source, source_id, title, funder, agency, status,
            open_date, deadline, amount_max, currency, categories, url, description,
            country, region)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          g.source, g.source_id, g.title, g.funder, g.agency, g.status,
          g.open_date, g.deadline, g.amount_max, g.currency || 'USD',
          g.categories, g.url, g.description, g.country, g.region
        )
      );
      newCount++;
    }
  }

  for (let i = 0; i < stmts.length; i += CHUNK) {
    await db.batch(stmts.slice(i, i + CHUNK));
  }

  return { newCount, updatedCount };
}

function unwrap(val) {
  if (Array.isArray(val)) return val[0];
  return val;
}

function extractDate(val) {
  if (!val) return null;
  const s = Array.isArray(val) ? val[0] : val;
  if (!s) return null;
  return s.split('T')[0];
}

async function startLog(db, source) {
  const result = await db.prepare(
    'INSERT INTO scrape_log (source) VALUES (?)'
  ).bind(source).run();
  return { id: result.meta.last_row_id };
}

async function finishLog(db, logId, found, newCount, updated, status, error = null) {
  await db.prepare(`
    UPDATE scrape_log SET finished_at = datetime('now'),
      grants_found = ?, grants_new = ?, grants_updated = ?,
      status = ?, error = ?
    WHERE id = ?
  `).bind(found, newCount, updated, status, error, logId).run();
}
