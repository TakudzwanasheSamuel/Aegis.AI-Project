-- Aegis.AI Historical Analytics — SQLite Schema
-- Lightweight local persistence for edge agents and dev environments

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS endpoints (
    id          TEXT PRIMARY KEY,
    hostname    TEXT NOT NULL,
    os_version  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incident_logs (
    id                   TEXT PRIMARY KEY,
    timestamp            TEXT NOT NULL,
    endpoint_id          TEXT NOT NULL REFERENCES endpoints(id),
    process_name         TEXT NOT NULL,
    pid                  INTEGER NOT NULL,
    risk_score           REAL NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    classification       TEXT NOT NULL,
    severity             TEXT NOT NULL CHECK (severity IN ('Safe', 'Moderate', 'High', 'Critical')),
    shap_top_contributor TEXT,
    action_taken         TEXT NOT NULL,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incident_logs_timestamp ON incident_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incident_logs_endpoint ON incident_logs (endpoint_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_severity ON incident_logs (severity);
CREATE INDEX IF NOT EXISTS idx_incident_logs_pid ON incident_logs (pid);

CREATE TABLE IF NOT EXISTS shap_explanations (
    id           TEXT PRIMARY KEY,
    incident_id  TEXT NOT NULL REFERENCES incident_logs(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    shap_value   REAL NOT NULL,
    rank         INTEGER NOT NULL,
    UNIQUE (incident_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_shap_explanations_incident ON shap_explanations (incident_id);

CREATE TABLE IF NOT EXISTS audit_trail (
    id          TEXT PRIMARY KEY,
    incident_id TEXT REFERENCES incident_logs(id) ON DELETE SET NULL,
    event_type  TEXT NOT NULL,
    actor       TEXT NOT NULL,
    payload     TEXT,
    timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_incident ON audit_trail (incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail (timestamp DESC);

-- View mirroring PostgreSQL materialized view for local analytics
CREATE VIEW IF NOT EXISTS vw_threat_frequency_daily AS
SELECT
    date(timestamp) AS bucket,
    COUNT(*) AS alert_count
FROM incident_logs
WHERE severity IN ('Moderate', 'High', 'Critical')
GROUP BY date(timestamp)
ORDER BY bucket;
