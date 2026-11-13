import { beforeEach, describe, expect, it } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { createVenueForOwner, newReferralCode, readSignup, slugify, validateSignup, validReferrer } from "@/lib/services/SignupService";

function freshDemoData() {
  delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
}

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("self-serve signup", () => {
  beforeEach(freshDemoData);

  it("validates the form and normalises email and referral code", () => {
    const input = readSignup(form({ ownerName: "Priya", email: " Priya@Example.com ", password: "long-enough", venueName: "Bean There", venueType: "cafe", referralCode: "JUNIPER1" }));
    expect(input.email).toBe("priya@example.com");
    expect(input.referralCode).toBe("juniper1");
    expect(validateSignup(input)).toEqual({});

    const bad = validateSignup(readSignup(form({ ownerName: "P", email: "nope", password: "short", venueName: "", venueType: "casino", referralCode: "x!" })));
    expect(Object.keys(bad).sort()).toEqual(["email", "ownerName", "password", "referralCode", "venueName", "venueType"]);
  });

  it("makes readable, unique slugs and short referral codes", () => {
    expect(slugify("Juniper & Oak Café!")).toBe("juniper-and-oak-cafe");
    expect(slugify("***")).toBe("venue");
    expect(newReferralCode()).toMatch(/^[a-z0-9]{8}$/);
  });

  it("creates the venue, credits a real referrer and makes the user its owner", async () => {
    const db = createDemoClient({ env: {} });
    expect(await validReferrer(db, "nosuchcode")).toBeNull();
    const referredBy = await validReferrer(db, "juniper1");
    expect(referredBy).toBe("juniper1");

    const venue = await createVenueForOwner(db, { userId: "new-owner", venueName: "Juniper & Oak Café", venueType: "cafe", address: "", referredBy });
    expect(venue.slug).toBe("juniper-and-oak-cafe"); // fixture uses a different slug
    expect(venue).toMatchObject({ referred_by_code: "juniper1", signup_source: "self_serve", pilot_status: "onboarded" });
    expect((await db.from("admin_users").select("*").eq("user_id", "new-owner").single()).data.role).toBe("venue_owner");
    expect((await db.from("venue_members").select("*").eq("user_id", "new-owner")).data).toHaveLength(1);

    const second = await createVenueForOwner(db, { userId: "other", venueName: "Juniper & Oak Café", venueType: "cafe", address: "", referredBy: null });
    expect(second.slug).toBe("juniper-and-oak-cafe-2");
  });

  it("never downgrades an admin who signs up a venue", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("admin_users").insert({ user_id: "boss", role: "admin" });
    await createVenueForOwner(db, { userId: "boss", venueName: "Test Venue", venueType: "other", address: "", referredBy: null });
    expect((await db.from("admin_users").select("*").eq("user_id", "boss").single()).data.role).toBe("admin");
  });
});
