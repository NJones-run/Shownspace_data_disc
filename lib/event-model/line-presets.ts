import type { TeamSide } from "./types";

export const MAX_LINE_PLAYERS = 7;

export interface LinePreset {
  id: string;
  label: string;
  playerIds: string[];
}

export type LinePresetsByTeam = Record<TeamSide, LinePreset[]>;

export function createEmptyLinePresets(): LinePreset[] {
  return [1, 2, 3].map((slot) => ({
    id: `line-${slot}`,
    label: `Line ${slot}`,
    playerIds: []
  }));
}

export function seedLinePresets(homePlayerIds: string[], awayPlayerIds: string[]): LinePresetsByTeam {
  return {
    home: createEmptyLinePresets().map((preset, index) =>
      index === 0 ? { ...preset, playerIds: homePlayerIds.slice(0, MAX_LINE_PLAYERS) } : preset
    ),
    away: createEmptyLinePresets().map((preset, index) =>
      index === 0 ? { ...preset, playerIds: awayPlayerIds.slice(0, MAX_LINE_PLAYERS) } : preset
    )
  };
}

export function togglePresetPlayer(playerIds: string[], playerId: string): string[] {
  if (playerIds.includes(playerId)) {
    return playerIds.filter((id) => id !== playerId);
  }
  if (playerIds.length >= MAX_LINE_PLAYERS) {
    return playerIds;
  }
  return [...playerIds, playerId];
}
