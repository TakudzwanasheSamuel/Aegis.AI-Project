-- Aegis.AI Historical Analytics — PostgreSQL Schema
-- Incident logging, SHAP persistence, and audit trail

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS endpoints (
    id          VARCHAR(64) PRIMARY KEY,
    hostname    VARCHAR(255) NOT NULL,
    os_version  VARCHAR(128),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_logs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp            TIMESTAMPTZ NOT NULL,
    endpoint_id          VARCHAR(64) NOT NULL REFERENCES endpoints(id),
    process_name         VARCHAR(255) NOT NULL,
    pid                  INTEGER NOT NULL,
    risk_score           DECIMAL(5, 2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    classification       VARCHAR(128) NOT NULL,
    severity             VARCHAR(20) NOT NULL CHECK (severity IN ('Safe', 'Moderate', 'High', 'Critical')),
    shap_top_contributor VARCHAR(255),
    action_taken         VARCHAR(255) NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_logs_timestamp ON incident_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incident_logs_endpoint ON incident_logs (endpoint_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_severity ON incident_logs (severity);
CREATE INDEX IF NOT EXISTS idx_incident_logs_pid ON incident_logs (pid);

CREATE TABLE IF NOT EXISTS shap_explanations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id  UUID NOT NULL REFERENCES incident_logs(id) ON DELETE CASCADE,
    feature_name VARCHAR(255) NOT NULL,
    shap_value   DECIMAL(8, 4) NOT NULL,
    rank         INTEGER NOT NULL,
    UNIQUE (incident_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_shap_explanations_incident ON shap_explanations (incident_id);

CREATE TABLE IF NOT EXISTS audit_trail (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incident_logs(id) ON DELETE SET NULL,
    event_type  VARCHAR(64) NOT NULL,
    actor       VARCHAR(128) NOT NULL,
    payload     JSONB,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_incident ON audit_trail (incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail (timestamp DESC);

-- Materialized view for threat frequency aggregation (refreshed by ETL job)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_threat_frequency_daily AS
SELECT
    DATE_TRUNC('day', timestamp) AS bucket,
    COUNT(*) AS alert_count
FROM incident_logs
WHERE severity IN ('Moderate', 'High', 'Critical')
GROUP BY 1
ORDER BY 1;
