import { describe, expect, it } from "vitest";
import { MoonbeamService } from "@/lib/services/MoonbeamService";

describe("MoonbeamService", () => {
  it("reports unconfigured protocol status", async () => {
    const status = await new MoonbeamService().status();
    expect(status.configured).toBe(false);
  });
});
