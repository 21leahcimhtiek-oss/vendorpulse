import OpenAI from "openai";
import type { Vendor, VendorScorecard, SpendRecord, RiskFlag, VendorContract } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateVendorSummary(
  vendor: Vendor,
  scorecards: VendorScorecard[],
  spend: SpendRecord[],
  riskFlags: RiskFlag[],
  contracts: VendorContract[]
): Promise<string> {
  const totalSpend = spend.reduce((sum, r) => sum + Number(r.amount_usd), 0);
  const latestScorecard = scorecards.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  const openFlags = riskFlags.filter((f) => f.status === "open");
  const activeContracts = contracts.filter((c) => c.status === "active");

  const prompt = `Write a concise executive summary of this vendor relationship for a procurement manager.

Vendor: ${vendor.name} (${vendor.category ?? "Uncategorized"})
Tier: ${vendor.tier} | Status: ${vendor.status}
Total Spend: $${totalSpend.toLocaleString()} across ${spend.length} records
Risk Score: ${vendor.risk_score ?? "Not assessed"}/100
Latest Scorecard: ${latestScorecard ? `Overall ${latestScorecard.overall_score}/10 (${latestScorecard.period})` : "No scorecards"}
Open Risk Flags: ${openFlags.length} (${[...new Set(openFlags.map((f) => f.severity))].join(", ") || "none"})
Active Contracts: ${activeContracts.length}

Write 3-4 sentences. Cover: relationship status, performance highlights, key risks, and a recommendation. Be specific and professional.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 300,
  });

  return completion.choices[0].message.content ?? "Unable to generate summary.";
}