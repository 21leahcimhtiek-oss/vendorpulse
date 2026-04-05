import { assessVendorRisk } from "@/lib/openai/assess-vendor-risk";
import type { Vendor, RiskFlag, SpendRecord, VendorScorecard } from "@/types";

// Mock OpenAI
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  risk_score: 42,
                  risk_factors: [
                    {
                      type: "financial",
                      severity: "medium",
                      description: "Vendor has moderate spend concentration risk",
                    },
                  ],
                  mitigation_recommendations: [
                    "Diversify suppliers in this category",
                    "Request quarterly financial reports",
                  ],
                  summary: "Vendor shows moderate risk profile with some financial concentration concerns.",
                }),
              },
            },
          ],
        }),
      },
    },
  }));
});

const mockVendor: Vendor = {
  id: "v1",
  org_id: "org-1",
  name: "Test Vendor",
  website: "https://testvendor.com",
  category: "IT Services",
  tier: "preferred",
  status: "active",
  contact_name: "Jane Smith",
  contact_email: "jane@testvendor.com",
  spend_ytd_usd: 75000,
  risk_score: null,
  ai_summary: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("assessVendorRisk", () => {
  it("returns a valid risk assessment", async () => {
    const result = await assessVendorRisk(mockVendor, [], [], []);

    expect(result).toBeDefined();
    expect(result.risk_score).toBe(42);
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.risk_score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.risk_factors)).toBe(true);
    expect(Array.isArray(result.mitigation_recommendations)).toBe(true);
    expect(typeof result.summary).toBe("string");
  });

  it("includes risk factors with correct structure", async () => {
    const result = await assessVendorRisk(mockVendor, [], [], []);

    result.risk_factors.forEach((factor) => {
      expect(["financial", "compliance", "operational", "reputational"]).toContain(factor.type);
      expect(["low", "medium", "high", "critical"]).toContain(factor.severity);
      expect(typeof factor.description).toBe("string");
      expect(factor.description.length).toBeGreaterThan(0);
    });
  });

  it("handles vendors with spend history correctly", async () => {
    const spendRecords: Partial<SpendRecord>[] = [
      { amount_usd: 25000, period_start: "2024-01-01", period_end: "2024-01-31" },
      { amount_usd: 30000, period_start: "2024-02-01", period_end: "2024-02-28" },
    ];

    const result = await assessVendorRisk(
      mockVendor,
      spendRecords as SpendRecord[],
      [],
      []
    );

    expect(result.risk_score).toBeDefined();
  });

  it("considers existing risk flags in assessment", async () => {
    const existingFlags: Partial<RiskFlag>[] = [
      {
        id: "f1",
        type: "financial",
        severity: "high",
        status: "open",
        description: "Late payment history",
        ai_detected: false,
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    const result = await assessVendorRisk(
      mockVendor,
      [],
      existingFlags as RiskFlag[],
      []
    );

    expect(result).toBeDefined();
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
  });
});