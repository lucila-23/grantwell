CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grant_name TEXT NOT NULL,
  funder TEXT NOT NULL DEFAULT 'Global Impact Alliance',
  project_name TEXT NOT NULL,
  org_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  org_website TEXT,
  org_founded INTEGER,
  org_mission TEXT,
  country TEXT,
  thematic_area TEXT,
  project_outline TEXT,
  sdg_alignment TEXT,
  budget_total REAL,
  budget_requested REAL,
  budget_breakdown TEXT,
  start_date TEXT,
  end_date TEXT,
  milestones TEXT,
  beneficiaries INTEGER,
  impact_measurement TEXT,
  sustainability_plan TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  event TEXT NOT NULL,
  type TEXT NOT NULL,
  event_date TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (application_id) REFERENCES applications(id)
);
