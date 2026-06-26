import { describe, expect, it } from "vitest";
import { EMPTY_CLOCK_INPUT, formatClock, maskClockInput, parseClock } from "@/lib/event-model/clock";

describe("clock helpers", () => {
  it("formats seconds as MM:SS", () => {
    expect(formatClock(845)).toBe("14:05");
    expect(formatClock(0)).toBe("00:00");
  });

  it("masks typed digits left-to-right with a persistent colon", () => {
    expect(maskClockInput("")).toBe(EMPTY_CLOCK_INPUT);
    expect(maskClockInput("1")).toBe("1_:__");
    expect(maskClockInput("12")).toBe("12:__");
    expect(maskClockInput("123")).toBe("12:3_");
    expect(maskClockInput("1234")).toBe("12:34");
    expect(maskClockInput("12:34")).toBe("12:34");
  });

  it("parses complete MM:SS values and rejects incomplete or invalid seconds", () => {
    expect(parseClock("12:34")).toBe(754);
    expect(parseClock("1:23")).toBe(83);
    expect(parseClock(EMPTY_CLOCK_INPUT)).toBeUndefined();
    expect(parseClock("12:__")).toBeUndefined();
    expect(parseClock("12:99")).toBeUndefined();
  });
});
