export const EMPTY_CLOCK_INPUT = "__:__";

export function formatClock(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function maskClockInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  const padded = digits.padEnd(4, "_");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

export function parseClock(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === EMPTY_CLOCK_INPUT) return undefined;

  const parts = trimmed.split(":");
  if (parts.length !== 2) return undefined;

  const [minutesText, secondsText] = parts;
  if (!/^\d{1,2}$/.test(minutesText) || !/^\d{2}$/.test(secondsText)) return undefined;

  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || seconds > 59) return undefined;

  return minutes * 60 + seconds;
}
