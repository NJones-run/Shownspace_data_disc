import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createTrackedTeamGame } from "@/lib/event-model/fixtures";
import type { CaptureGame, CapturePlayer } from "@/lib/event-model/types";

export interface AccessibleTeam {
  id: string;
  name: string;
  slug: string;
  accessRole: "manager" | "scorer";
  playerCount?: number;
}

export interface TeamPlayerInput {
  firstName: string;
  lastName: string;
  jerseyNumber?: string;
  active?: boolean;
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "team"
  );
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function parseScorerTokens(headerValue: string | null) {
  return (headerValue ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export async function getBearerUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) return null;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function managerTeamIds(userId: string | undefined) {
  if (!userId) return [];
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capture_team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("role", "manager");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.team_id as string);
}

async function scorerTeamIds(tokens: string[]) {
  if (!tokens.length) return [];
  const supabase = createServerSupabaseClient();
  const hashes = tokens.map(hashInviteToken);
  const { data, error } = await supabase
    .from("capture_team_invites")
    .select("team_id,expires_at")
    .in("token_hash", hashes)
    .is("revoked_at", null);
  if (error) throw new Error(error.message);
  const now = Date.now();
  return (data ?? [])
    .filter((row) => !row.expires_at || Date.parse(row.expires_at as string) > now)
    .map((row) => row.team_id as string);
}

export async function listAccessibleTeams(userId: string | undefined, scorerTokens: string[]) {
  const supabase = createServerSupabaseClient();
  const managerIds = new Set(await managerTeamIds(userId));
  const scorerIds = new Set(await scorerTeamIds(scorerTokens));
  const ids = Array.from(new Set([...managerIds, ...scorerIds]));
  if (!ids.length) return [];

  const { data, error } = await supabase.from("capture_teams").select("id,name,slug").in("id", ids).order("name");
  if (error) throw new Error(error.message);

  const { data: players, error: playerError } = await supabase
    .from("capture_team_players")
    .select("team_id")
    .in("team_id", ids)
    .eq("active", true);
  if (playerError) throw new Error(playerError.message);
  const playerCounts = new Map<string, number>();
  (players ?? []).forEach((player) => {
    const teamId = player.team_id as string;
    playerCounts.set(teamId, (playerCounts.get(teamId) ?? 0) + 1);
  });

  return (data ?? []).map((team): AccessibleTeam => ({
    id: team.id as string,
    name: team.name as string,
    slug: team.slug as string,
    accessRole: managerIds.has(team.id as string) ? "manager" : "scorer",
    playerCount: playerCounts.get(team.id as string) ?? 0
  }));
}

export async function assertManager(teamId: string, userId: string | undefined) {
  if (!userId) throw new Error("Manager sign-in required");
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capture_team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("role", "manager")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Manager access required");
}

export async function assertTeamAccess(teamId: string, userId: string | undefined, scorerTokens: string[]) {
  if (userId) {
    const ids = await managerTeamIds(userId);
    if (ids.includes(teamId)) return;
  }
  const ids = await scorerTeamIds(scorerTokens);
  if (ids.includes(teamId)) return;
  throw new Error("Team access required");
}

export async function createTeam(name: string, userId: string | undefined) {
  if (!userId) throw new Error("Manager sign-in required");
  const supabase = createServerSupabaseClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Team name is required");
  const { data: team, error } = await supabase
    .from("capture_teams")
    .insert({ name: trimmed, slug: `${slugify(trimmed)}-${nanoid(6)}`, created_by: userId })
    .select("id,name,slug")
    .single();
  if (error) throw new Error(error.message);

  const { error: memberError } = await supabase
    .from("capture_team_members")
    .insert({ team_id: team.id, user_id: userId, role: "manager" });
  if (memberError) throw new Error(memberError.message);
  return team;
}

export async function updateTeam(teamId: string, name: string, userId: string | undefined) {
  await assertManager(teamId, userId);
  const supabase = createServerSupabaseClient();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Team name is required");
  const { data, error } = await supabase
    .from("capture_teams")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", teamId)
    .select("id,name,slug")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listPlayers(teamId: string, userId: string | undefined, scorerTokens: string[]) {
  await assertTeamAccess(teamId, userId, scorerTokens);
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capture_team_players")
    .select("id,team_id,player_id,first_name,last_name,jersey_number,active")
    .eq("team_id", teamId)
    .order("last_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addPlayer(teamId: string, input: TeamPlayerInput, userId: string | undefined) {
  await assertManager(teamId, userId);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) throw new Error("Player first and last name are required");
  const supabase = createServerSupabaseClient();
  const playerId = `${teamId}-${slugify(`${firstName}-${lastName}`)}-${nanoid(5)}`;
  const { data, error } = await supabase
    .from("capture_team_players")
    .insert({
      team_id: teamId,
      player_id: playerId,
      first_name: firstName,
      last_name: lastName,
      jersey_number: input.jerseyNumber?.trim() || null,
      active: input.active ?? true
    })
    .select("id,team_id,player_id,first_name,last_name,jersey_number,active")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePlayer(teamId: string, rowId: string, input: TeamPlayerInput, userId: string | undefined) {
  await assertManager(teamId, userId);
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capture_team_players")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      jersey_number: input.jerseyNumber?.trim() || null,
      active: input.active ?? true,
      updated_at: new Date().toISOString()
    })
    .eq("team_id", teamId)
    .eq("id", rowId)
    .select("id,team_id,player_id,first_name,last_name,jersey_number,active")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deactivatePlayer(teamId: string, rowId: string, userId: string | undefined) {
  await assertManager(teamId, userId);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("capture_team_players")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("team_id", teamId)
    .eq("id", rowId);
  if (error) throw new Error(error.message);
}

export async function createInvite(teamId: string, userId: string | undefined, label?: string) {
  await assertManager(teamId, userId);
  const supabase = createServerSupabaseClient();
  const token = randomBytes(32).toString("base64url");
  const { data, error } = await supabase
    .from("capture_team_invites")
    .insert({
      team_id: teamId,
      token_hash: hashInviteToken(token),
      label: label?.trim() || null,
      created_by: userId
    })
    .select("id,team_id,label,created_at,revoked_at,expires_at")
    .single();
  if (error) throw new Error(error.message);
  return { invite: data, token };
}

export async function listInvites(teamId: string, userId: string | undefined) {
  await assertManager(teamId, userId);
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capture_team_invites")
    .select("id,team_id,label,created_at,revoked_at,expires_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function revokeInvite(teamId: string, inviteId: string, userId: string | undefined) {
  await assertManager(teamId, userId);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("capture_team_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("team_id", teamId)
    .eq("id", inviteId);
  if (error) throw new Error(error.message);
}

export async function acceptInvite(token: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capture_team_invites")
    .select("team_id,expires_at,revoked_at")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.revoked_at || (data.expires_at && Date.parse(data.expires_at as string) <= Date.now())) {
    throw new Error("Invite is invalid or expired");
  }
  const { data: team, error: teamError } = await supabase
    .from("capture_teams")
    .select("id,name,slug")
    .eq("id", data.team_id)
    .single();
  if (teamError) throw new Error(teamError.message);
  return team;
}

export function sharedGameFromTrackedTeam({
  team,
  opponentName,
  gameDate,
  tournamentName
}: {
  team: AccessibleTeam;
  opponentName: string;
  gameDate: string;
  tournamentName?: string;
}): CaptureGame {
  return {
    ...createTrackedTeamGame({
      trackedTeamId: team.id,
      trackedTeamName: team.name,
      opponentName,
      gameDate,
      tournamentName
    }),
    GameID: `shared-${team.slug}-vs-${opponentName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "opponent"}-${gameDate}-${nanoid(6)}`
  };
}

export function playerRowToCapturePlayer(row: Record<string, unknown>): CapturePlayer {
  return {
    PlayerID: String(row.player_id),
    TeamID: String(row.team_id),
    Year: new Date().getFullYear(),
    FirstName: String(row.first_name),
    LastName: String(row.last_name),
    JerseyNumber: row.jersey_number ? String(row.jersey_number) : undefined
  };
}
