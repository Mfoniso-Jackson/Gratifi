import { expect, test } from "@playwright/test";

const LAMPLIGHTER = "de30a001-0000-4000-8000-000000000003";
const CAFE = "de30a001-0000-4000-8000-000000000001";

test("an owner chooses a plan with the payroll add-on", async ({ page }) => {
  await page.goto(`/admin/billing?venueId=${LAMPLIGHTER}`);
  await expect(page.getByText(/Free pilot: \d+ days? left/)).toBeVisible();
  const starter = page.locator("form", { has: page.locator('input[value="starter"]') });
  await starter.getByLabel(/Add payroll export/).check();
  await starter.getByRole("button", { name: "Choose Starter" }).click();
  await expect(page.getByText("Starter · monthly + payroll export")).toBeVisible();
});

test("payroll page and CSV list each staff member", async ({ page, request }) => {
  await page.goto(`/admin/payroll?venueId=${CAFE}&from=2020-01-01&to=2099-12-31`);
  await expect(page.locator("tbody tr")).toHaveCount(4);
  const csv = await request.get(`/api/admin/payroll-export?venueId=${CAFE}&from=2020-01-01&to=2099-12-31`);
  expect(csv.status()).toBe(200);
  expect((await csv.text()).split("\n")[0]).toContain("net_gbp");
});

test("tips page filters and shows statuses", async ({ page }) => {
  await page.goto("/admin/events");
  await expect(page.getByRole("heading", { name: "Tips" })).toBeVisible();
  await page.getByLabel("Show").selectOption("unrecorded");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("will retry").first()).toBeVisible();
});

test("protocol and venue pages render", async ({ page }) => {
  await page.goto("/admin/protocol");
  await expect(page.getByText("Tips in the database")).toBeVisible();
  await page.goto("/admin/venues");
  await expect(page.getByRole("link", { name: /Juniper & Oak Café/ })).toBeVisible();
});

test("a customer's deletion request is received and handled", async ({ page }) => {
  await page.goto("/privacy/requests");
  await page.getByLabel("I'd like you to").selectOption("delete");
  await page.getByLabel("Email for our reply").fill("tipper@example.com");
  await page.getByLabel("Venue", { exact: true }).fill("Juniper");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/Your reference is DR-/)).toBeVisible();

  await page.goto("/admin/data-requests");
  await page.getByRole("link", { name: "DR-4F2A9C1E" }).click();
  await expect(page.getByRole("heading", { name: "DR-4F2A9C1E" })).toBeVisible();
  const tips = page.locator('input[name="tipIds"]');
  await expect(tips.first()).toBeVisible();
  await tips.first().check();
  await page.getByLabel("I've confirmed this is the person").check();
  await page.getByRole("button", { name: "Erase selected" }).click();
  await expect(page.getByText(/Erased 0 staff record\(s\) and 1 tip note\(s\)/)).toBeVisible();
});

test("an NFC tap opens the tip page and shows on the staff card", async ({ page }) => {
  const MAYA = "de30b002-0000-4000-8000-000000000001";
  await page.goto("/admin/workers");
  await page.getByRole("link", { name: "QR and NFC card" }).first().click();
  await expect(page.getByRole("heading", { name: /tip card/ })).toBeVisible();
  await page.goto(`/admin/workers/${MAYA}/card`);
  const before = Number((await page.getByText(/NFC taps?\./).textContent())?.match(/(\d+) NFC/)?.[1]);
  await expect(page.getByLabel("NFC link")).toHaveValue(new RegExp(`/tip/${MAYA}\\?src=nfc$`));

  await page.goto(`/tip/${MAYA}?src=nfc`);
  await expect(page.getByText("Maya").first()).toBeVisible();

  await page.goto(`/admin/workers/${MAYA}/card`);
  await expect(page.getByText(`${before + 1} NFC tap`)).toBeVisible();
});
