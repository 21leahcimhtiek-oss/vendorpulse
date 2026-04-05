import OpenAI from "openai";
import type { Vendor, RiskFlag, SpendRecord, VendorScorecard } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RiskAssessmentResult {
  risk_score: number;
  risk_factors: Array<{
    type: "financial" | "compliance" | "operational" | "reputational";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
  }>;
  mitigation_recommendations: string[];
  summary: string;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function assessVendorRisk(
  vendor: Vendor,
  recentSpend: SpendRecord[],
  existingFlags: RiskFlag[],
  scorecards: VendorScorecard[]
): Promise<RiskAssessmentResult> {
  const totalSpend = recentSpend.reduce((sum, r) => sum + Number(r.amount_usd), 0);
  const avgScore =
    scorecards.length > 0
      ? scorecards.reduce((sum, s) => sum + Number(s.overall_score), 0) / scorecards.length
      : null;

  const prompt = `You are an expert procurement risk analyst. Analyze this vendor and provide a risk assessment.

VENDOR PROFILE:
- Name: ${vendor.name}
- Category: ${vendor.category ?? "Unknown"}
- Tier: ${vendor.tier}
- Status: ${vendor.status}
- YTD Spend: $${vendor.spend_ytd_usd.toLocaleString()}
- Total Spend (records): $${totalSpend.toLocaleString()}
- Scorecard periods: ${scorecards.length}
- Average scorecard score: ${avgScore !== null ? avgScore.toFixed(1) + "/10" : "No scorecards"}
- Existing open risk flags: ${existingFlags.filter((f) => f.status === "open").length}
- Flag types: ${[...new Set(existingFlags.map((f) => f.type))].join(", ") || "None"}

Respond ONLY with valid JSON matching this schema:
{
  "risk_score": <integer 0-100, higher = more risky>,
  "risk_factors": [
    {
      "type": <"financial"|"compliance"|"operational"|"reputational">,
      "severity": <"low"|"medium"|"high"|"critical">,
      "description": <string, 1-2 sentences>
    }
  ],
  "mitigation_recommendations": [<string>, ...],
  "summary": <string, 2-3 sentences>
}`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800,
      });

      const result = JSON.parse(completion.choices[0].message.content ?? "{}");
      return result as RiskAssessmentResult;
    } catch (err) {
      lastError = err as Error;
      if (attempt < 2) await delay(1000 * (attempt + 1));
    }
  }
  throw lastError;
}