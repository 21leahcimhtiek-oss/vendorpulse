import { NextRequest } from "next/server";

// Mock Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockInsert = jest.fn().mockReturnThis();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@test.com" } },
      }),
    },
    from: (table: string) => ({
      select: mockSelect,
      insert: mockInsert,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    }),
  }),
}));

jest.mock("@/lib/rate-limit", () => ({
  apiRateLimit: {},
  checkRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 99 }),
}));

describe("GET /api/vendors", () => {
  it("returns 401 for unauthenticated requests", async () => {
    const { createClient } = require("@/lib/supabase/server");
    (createClient as jest.Mock).mockResolvedValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });

    const { GET } = await import("@/app/api/vendors/route");
    const req = new NextRequest("http://localhost/api/vendors");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns vendor list for authenticated users", async () => {
    mockSingle.mockResolvedValueOnce({ data: { org_id: "org-1" }, error: null });
    mockLimit.mockResolvedValueOnce({
      data: [
        { id: "v1", name: "Acme Corp", tier: "preferred", spend_ytd_usd: 50000, risk_score: 25 },
      ],
      error: null,
    });

    const { GET } = await import("@/app/api/vendors/route");
    const req = new NextRequest("http://localhost/api/vendors");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Acme Corp");
  });
});

describe("POST /api/vendors", () => {
  it("validates required fields", async () => {
    mockSingle.mockResolvedValueOnce({ data: { org_id: "org-1" }, error: null });

    const { POST } = await import("@/app/api/vendors/route");
    const req = new NextRequest("http://localhost/api/vendors", {
      method: "POST",
      body: JSON.stringify({ name: "" }), // Empty name
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("creates a vendor with valid data", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { org_id: "org-1" }, error: null })
      .mockResolvedValueOnce({
        data: { id: "v-new", name: "New Vendor", tier: "approved", org_id: "org-1" },
        error: null,
      });

    const { POST } = await import("@/app/api/vendors/route");
    const req = new NextRequest("http://localhost/api/vendors", {
      method: "POST",
      body: JSON.stringify({ name: "New Vendor", tier: "approved", status: "active" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});