export type Plan = "starter" | "pro" | "enterprise";
export type VendorTier = "strategic" | "preferred" | "approved" | "unapproved";
export type VendorStatus = "active" | "inactive" | "under_review" | "blacklisted";
export type RiskType = "financial" | "compliance" | "operational" | "reputational";
export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskFlagStatus = "open" | "acknowledged" | "resolved";
export type ContractStatus = "active" | "expired" | "terminated" | "draft";
export type OrgRole = "owner" | "admin" | "member";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Org {
  id: string;
  name: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Vendor {
  id: string;
  org_id: string;
  name: string;
  website: string | null;
  category: string | null;
  tier: VendorTier;
  status: VendorStatus;
  contact_name: string | null;
  contact_email: string | null;
  spend_ytd_usd: number;
  risk_score: number | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface SpendRecord {
  id: string;
  org_id: string;
  vendor_id: string;
  amount_usd: number;
  category: string | null;
  department: string | null;
  period_start: string;
  period_end: string;
  invoice_ref: string | null;
  created_at: string;
}

export interface VendorScorecard {
  id: string;
  vendor_id: string;
  org_id: string;
  period: string;
  quality_score: number;
  delivery_score: number;
  communication_score: number;
  value_score: number;
  overall_score: number;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface RiskFlag {
  id: string;
  vendor_id: string;
  org_id: string;
  type: RiskType;
  severity: RiskSeverity;
  description: string;
  status: RiskFlagStatus;
  ai_detected: boolean;
  created_at: string;
}

export interface VendorContract {
  id: string;
  vendor_id: string;
  org_id: string;
  title: string;
  type: string | null;
  value_usd: number | null;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  status: ContractStatus;
  created_at: string;
}

export interface Alert {
  id: string;
  org_id: string;
  vendor_id: string | null;
  type: string;
  message: string;
  severity: AlertSeverity;
  read_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalVendors: number;
  atRiskVendors: number;
  ytdSpend: number;
  contractsExpiringSoon: number;
}

export interface SpendByGroup {
  label: string;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}