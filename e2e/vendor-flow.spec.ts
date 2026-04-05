import { test, expect } from "@playwright/test";

test.describe("Vendor Flow", () => {
  test.beforeEach(async ({ page }) => {
    // In a real test, we would sign in via UI or API
    // For this spec, we assume a pre-authenticated session via storage state
    await page.goto("/");
  });

  test("landing page loads correctly", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /manage every vendor/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /view pricing/i })).toBeVisible();
  });

  test("landing page has pricing section", async ({ page }) => {
    await page.getByRole("link", { name: /view pricing/i }).click();
    await expect(page.getByRole("heading", { name: /simple, transparent pricing/i })).toBeVisible();
    await expect(page.getByText("$89")).toBeVisible();
    await expect(page.getByText("$229")).toBeVisible();
    await expect(page.getByText("$549")).toBeVisible();
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup page is accessible", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create free account/i })).toBeVisible();
  });

  test("login form validates required fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("required");
  });

  test("signup links to login", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("reset password page works", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});

test.describe("Dashboard Navigation (authenticated)", () => {
  // These tests require authentication state
  // Set up via playwright.config.ts storageState after actual login
  test.skip("dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});