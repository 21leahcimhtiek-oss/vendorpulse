-- VendorPulse Initial Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE orgs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  plan                  TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','enterprise')),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE org_members (
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE vendors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  website         TEXT,
  category        TEXT,
  tier            TEXT NOT NULL DEFAULT 'approved' CHECK (tier IN ('strategic','preferred','approved','unapproved')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','under_review','blacklisted')),
  contact_name    TEXT,
  contact_email   TEXT,
  spend_ytd_usd   NUMERIC(15,2) NOT NULL DEFAULT 0,
  risk_score      INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  ai_summary      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vendor_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spend_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount_usd    NUMERIC(15,2) NOT NULL,
  category      TEXT,
  department    TEXT,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  invoice_ref   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vendor_scorecards (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id             UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  org_id                UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  period                TEXT NOT NULL,
  quality_score         INTEGER NOT NULL CHECK (quality_score BETWEEN 1 AND 10),
  delivery_score        INTEGER NOT NULL CHECK (delivery_score BETWEEN 1 AND 10),
  communication_score   INTEGER NOT NULL CHECK (communication_score BETWEEN 1 AND 10),
  value_score           INTEGER NOT NULL CHECK (value_score BETWEEN 1 AND 10),
  overall_score         NUMERIC(4,2) NOT NULL,
  notes                 TEXT,
  created_by            UUID NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE risk_flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('financial','compliance','operational','reputational')),
  severity     TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  description  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  ai_detected  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vendor_contracts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT,
  value_usd   NUMERIC(15,2),
  start_date  DATE NOT NULL,
  end_date    DATE,
  auto_renew  BOOLEAN NOT NULL DEFAULT FALSE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','terminated','draft')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  vendor_id   UUID REFERENCES vendors(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendors_org_id       ON vendors(org_id);
CREATE INDEX idx_vendors_tier         ON vendors(org_id, tier);
CREATE INDEX idx_vendors_status       ON vendors(org_id, status);
CREATE INDEX idx_vendors_risk_score   ON vendors(org_id, risk_score DESC);
CREATE INDEX idx_spend_org_vendor     ON spend_records(org_id, vendor_id);
CREATE INDEX idx_spend_period         ON spend_records(org_id, period_start);
CREATE INDEX idx_spend_department     ON spend_records(org_id, department);
CREATE INDEX idx_spend_category       ON spend_records(org_id, category);
CREATE INDEX idx_risk_flags_org       ON risk_flags(org_id);
CREATE INDEX idx_risk_flags_severity  ON risk_flags(org_id, severity, status);
CREATE INDEX idx_risk_flags_vendor    ON risk_flags(vendor_id, status);
CREATE INDEX idx_scorecards_vendor    ON vendor_scorecards(vendor_id);
CREATE INDEX idx_contracts_org        ON vendor_contracts(org_id, status, end_date);
CREATE INDEX idx_alerts_org_unread    ON alerts(org_id, read_at) WHERE read_at IS NULL;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE orgs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_scorecards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_flags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read own org" ON org_members FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM org_members WHERE org_id = check_org_id AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "org members can read vendors"   ON vendors FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "org members can insert vendors" ON vendors FOR INSERT WITH CHECK (is_org_member(org_id));
CREATE POLICY "org members can update vendors" ON vendors FOR UPDATE USING (is_org_member(org_id));
CREATE POLICY "org members can delete vendors" ON vendors FOR DELETE USING (is_org_member(org_id));
CREATE POLICY "org members can manage spend"    ON spend_records     FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "org members can manage scorecards" ON vendor_scorecards FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "org members can manage risk_flags" ON risk_flags FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "org members can manage contracts"  ON vendor_contracts  FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "org members can manage contacts"   ON vendor_contacts   FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "org members can manage alerts"     ON alerts            FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));