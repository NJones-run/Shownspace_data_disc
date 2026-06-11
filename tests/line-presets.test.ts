import { describe, expect, it } from "vitest";
import { createEmptyLinePresets, seedLinePresets, togglePresetPlayer } from "@/lib/event-model/line-presets";

describe("line preset helpers", () => {
  it("creates three fixed line presets", () => {
    const presets = createEmptyLinePresets();

    expect(presets).toEqual([
      { id: "line-1", label: "Line 1", playerIds: [] },
      { id: "line-2", label: "Line 2", playerIds: [] },
      { id: "line-3", label: "Line 3", playerIds: [] }
    ]);
  });

  it("seeds the first preset for each team and trims to seven players", () => {
    const presets = seedLinePresets(
      ["home-1", "home-2", "home-3", "home-4", "home-5", "home-6", "home-7", "home-8"],
      ["away-1"]
    );

    expect(presets.home[0].playerIds).toEqual(["home-1", "home-2", "home-3", "home-4", "home-5", "home-6", "home-7"]);
    expect(presets.home[1].playerIds).toEqual([]);
    expect(presets.away[0].playerIds).toEqual(["away-1"]);
  });

  it("does not add an eighth player to a preset", () => {
    const fullLine = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];

    expect(togglePresetPlayer(fullLine, "p8")).toEqual(fullLine);
    expect(togglePresetPlayer(fullLine, "p4")).toEqual(["p1", "p2", "p3", "p5", "p6", "p7"]);
  });
});
