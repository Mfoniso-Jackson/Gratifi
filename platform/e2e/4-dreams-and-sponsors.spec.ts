import { expect, test } from "@playwright/test";

const BARBER = "de30a001-0000-4000-8000-000000000002";
const DEV = "de30b002-0000-4000-8000-000000000005";
const SPONSOR = "de30f007-0000-4000-8000-000000000001";

test("a manager approves a staff dream and it appears on the Dream Wall", async ({ page }) => {
  await page.goto("/admin/workers");
  const pending = page.locator("form", { hasText: "latte art championship" });
  await pending.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Dreams waiting for your approval")).toHaveCount(0);

  await page.goto("/dreams?venue=demo-cafe");
  await expect(page.getByText("Entry to the regional latte art championship")).toBeVisible();
  await expect(page.getByRole("link", { name: "Thank Tom" })).toBeVisible();
});

test("staff see their own tips and can propose a dream", async ({ page }) => {
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Hi Maya" })).toBeVisible();
  await page.getByRole("button", { name: "Withdraw my dream" }).click();
  await page.getByLabel("What's your dream?").fill("Coffee roasting course");
  await page.getByLabel("What it costs (£)").fill("300");
  await page.getByRole("button", { name: "Send to my manager" }).click();
  await expect(page.getByText("Waiting for your manager to approve it.")).toBeVisible();
});

test("an owner blocks a sponsor and it disappears from their staff's tip page", async ({ page }) => {
  await page.goto(`/tip/${DEV}`);
  await expect(page.getByText("Backed by")).toBeVisible();
  await page.goto(`/admin/venues/${BARBER}`);
  await page.locator("form", { hasText: "Your Brand Here" }).getByRole("button", { name: "Block" }).click();
  await expect(page.locator("form", { hasText: "Your Brand Here" }).getByText("Blocked")).toBeVisible();
  await page.goto(`/tip/${DEV}`);
  await expect(page.getByText("Backed by")).toHaveCount(0);
});

test("a brand is invoiced for its placement fee", async ({ page }) => {
  await page.goto(`/admin/sponsors/${SPONSOR}`);
  await expect(page.getByText("Brand report")).toBeVisible();
  await page.getByLabel("Billing email").fill("accounts@brand.example");
  await page.getByRole("button", { name: "Save" }).first().click();
  await page.getByLabel("Amount (£)").fill("2500");
  await page.getByRole("button", { name: "Send invoice" }).click();
  await expect(page.getByText("Awaiting payment")).toBeVisible();
});
