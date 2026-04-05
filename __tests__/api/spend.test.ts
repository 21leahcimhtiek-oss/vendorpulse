import { NextRequest } from "next/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@test.com" } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { org_id: "org-1" }, error: null }),
    }),
  }),
}));

jest.mock("@/lib/rate-limit", () => ({
  apiRateLimit: {},
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 99 }),
}));

describe("GET /api/spend", () => {
  it("returns 401 for unauthenticated requests", async () => {
    const { createClient } = require("@/lib/supabase/server");
    (createClient as jest.Mock).mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });

    const { GET } = await import("@/app/api/spend/route");
    const req = new NextRequest("http://localhost/api/spend");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns aggregated spend data", async () => {
    const { createClient } = require("@/lib/supabase/server");
    (createClient as jest.Mock).mockResolvedValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { org_id: "org-1" }, error: null }),
        then: jest.fn().mockResolvedValue({
          data: [
            { amount_usd: 10000, category: "IT", department: "Engineering", period_start: "2024-01-01", vendor_id: "v1", vendors: { name: "TechCorp" } },
            { amount_usd: 5000, category: "IT", department: "Marketing", period_start: "2024-02-01", vendor_id: "v2", vendors: { name: "Vendor B" } },
          ],
          error: null,
        }),
      }),
    });

    const { GET } = await import("@/app/api/spend/route");
    const req = new NextRequest("http://localhost/api/spend?groupBy=vendor");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("Spend CSV validation", () => {
  it("validates correct spend record schema", () => {
    const { z } = require("zod");
    const SpendRecordSchema = z.object({
      vendor_id: z.string().uuid(),
      amount_usd: z.number().positive(),
      period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const valid = SpendRecordSchema.safeParse({
      vendor_id: "123e4567-e89b-12d3-a456-426614174000",
      amount_usd: 1500.00,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    });
    expect(valid.success).toBe(true);

    const invalid = SpendRecordSchema.safeParse({
      vendor_id: "not-a-uuid",
      amount_usd: -100,
      period_start: "2024/01/01",
      period_end: "2024-01-31",
    });
    expect(invalid.success).toBe(false);
  });
});