import { describe, expect, it } from "vitest";
import { hashInviteToken, parseScorerTokens } from "@/lib/team-library/server";

describe("team library server helpers", () => {
  it("hashes invite tokens without exposing the raw token", () => {
    const token = "invite-token";
    const hash = hashInviteToken(token);

    expect(hash).not.toBe(token);
    expect(hash).toHaveLength(64);
    expect(hashInviteToken(token)).toBe(hash);
  });

  it("parses scorer token headers", () => {
    expect(parseScorerTokens(" one, two ,,three ")).toEqual(["one", "two", "three"]);
  });
});
