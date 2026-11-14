import { expect, test } from "@playwright/test";

test("home page explains GratiFi to venues", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Let customers thank the people who served them." })).toBeVisible();
  await expect(page.getByText("Demo mode")).toBeVisible();
});

test("a customer tips toward a staff member's dream and sees the thank-you page", async ({ page }) => {
  await page.goto("/v/demo-cafe?src=qr");
  await expect(page.getByRole("heading", { name: "Juniper & Oak Café" })).toBeVisible();
  await page.getByRole("link", { name: /Maya/ }).click();

  await expect(page.getByRole("heading", { name: "Thank Maya" })).toBeVisible();
  await page.locator("label", { hasText: "£10" }).click();
  await expect(page.getByText(/takes Maya to \d+% of the goal/)).toBeVisible();
  await page.getByLabel(/Add a note/).fill("Brilliant flat white");
  await page.getByRole("button", { name: "Send £10 to Maya's dream" }).click();

  await expect(page).toHaveURL(/\/success\?event=/);
  await expect(page.getByText("£10.00 to Maya")).toBeVisible();
  await expect(page.getByText("“Brilliant flat white”")).toBeVisible();
  await expect(page.getByText(/You moved Maya from \d+% to \d+%/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Get GratiFi for your venue" })).toHaveAttribute("href", "/for-venues?ref=juniper1");
});

test("a customer can add the card fee so the full tip reaches staff", async ({ page }) => {
  await page.goto("/tip/de30b002-0000-4000-8000-000000000002");
  await expect(page.getByRole("heading", { name: "Thank Tom" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to payment" })).toBeVisible();
  await page.getByLabel("Add 28p for the card fee so Tom gets the full £5").check();
  await expect(page.getByRole("button", { name: "Continue to payment · £5.28" })).toBeVisible();
  await page.locator("label", { hasText: "£3" }).first().click();
  await expect(page.getByRole("button", { name: "Continue to payment · £3.25" })).toBeVisible();
});

test("an unknown venue shows a not-found page", async ({ page }) => {
  const response = await page.goto("/v/no-such-venue");
  expect(response?.status()).toBe(404);
});

test("pages fit a phone screen", async ({ browser }) => {
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await phone.newPage();
  for (const path of ["/", "/v/demo-cafe", "/for-venues", "/dreams", "/privacy/requests"]) {
    await page.goto(path);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, `${path} scrolls sideways`).toBeLessThanOrEqual(390);
  }
  await phone.close();
});

test("privacy notice and terms are linked from every public page", async ({ page }) => {
  await page.goto("/");
  await page.locator("footer").getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { name: "Privacy notice" })).toBeVisible();
  await expect(page.getByText("Draft for legal review.")).toBeVisible();
  await page.locator("footer").getByRole("link", { name: "Terms" }).click();
  await expect(page.getByRole("heading", { name: "Terms", exact: true })).toBeVisible();
});
