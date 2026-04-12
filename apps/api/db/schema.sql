CREATE TABLE users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai'
);

CREATE TABLE cycle_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  flow_level TEXT NOT NULL,
  pain_level SMALLINT NOT NULL,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  mood TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prediction_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  predicted_start_date DATE NOT NULL,
  window_start_date DATE NOT NULL,
  window_end_date DATE NOT NULL,
  predicted_cycle_length SMALLINT NOT NULL,
  predicted_period_length SMALLINT NOT NULL,
  cycle_variability SMALLINT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL,
  status TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  rationale TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reminder_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  quiet_hours_start TIME NOT NULL,
  quiet_hours_end TIME NOT NULL,
  items JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consent_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  version TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL,
  withdrawn_at TIMESTAMPTZ
);

CREATE TABLE user_privacy_actions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  requested_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE metric_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  context JSONB
);

CREATE INDEX idx_cycle_records_user_start_date ON cycle_records(user_id, start_date DESC);
CREATE INDEX idx_metric_events_user_name ON metric_events(user_id, name);
CREATE INDEX idx_consent_records_user_type ON consent_records(user_id, type);
CREATE INDEX idx_privacy_actions_user_type ON user_privacy_actions(user_id, type);

