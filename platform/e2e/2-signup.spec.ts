import { expect, test } from "@playwright/test";

test("a venue signs up through a referral link and the referrer is credited", async ({ page }) => {
  await page.goto("/for-venues?ref=juniper1");
  await expect(page.getByText("Referred by a GratiFi venue")).toBeVisible();
  await page.getByLabel("Your name").fill("Sam Lee");
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel(/Password/).fill("password123");
  await page.getByLabel("Venue name").fill("Bean & Gone");
  await page.getByRole("button", { name: "Start my free 30-day pilot" }).click();

  await expect(page).toHaveURL(/\/admin\/venues\/.+\?welcome=1/);
  await expect(page.getByText("Your 30-day pilot has started")).toBeVisible();

  await page.goto("/admin/venues/de30a001-0000-4000-8000-000000000001");
  await expect(page.getByText(/joined through you:.*Bean & Gone/)).toBeVisible();
});

test("signup explains what's wrong with the form", async ({ page }) => {
  await page.goto("/for-venues");
  await page.getByLabel("Your name").fill("Sam");
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel(/Password/).fill("password123");
  await page.getByLabel("Venue name").fill("x");
  await page.getByRole("button", { name: "Start my free 30-day pilot" }).click();
  await expect(page.getByText("Enter your venue's name.")).toBeVisible();
});
