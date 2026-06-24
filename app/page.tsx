"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { demoGame, demoPlayers } from "@/lib/event-model/fixtures";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { scorerTokenHeader } from "@/lib/team-library/client-access";

interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  accessRole: "manager" | "scorer";
  playerCount: number;
}

interface TeamPlayerRow {
  id: string;
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number?: string | null;
  active: boolean;
}

async function authHeader() {
  try {
    const { data } = await createBrowserSupabaseClient().auth.getSession();
    return data.session?.access_token ? { authorization: `Bearer ${data.session.access_token}` } : {};
  } catch {
    return {};
  }
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = init.body ? { "Content-Type": "application/json" } : {};
  const auth = await authHeader();
  if (auth.authorization) headers.authorization = auth.authorization;
  const scorerTokens = scorerTokenHeader();
  if (scorerTokens) headers["x-scorer-tokens"] = scorerTokens;
  Object.assign(headers, init.headers);
  const response = await fetch(path, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed: ${response.status}`);
  return body;
}

function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HomePage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"signIn" | "create">("signIn");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerPasswordConfirm, setManagerPasswordConfirm] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [query, setQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [gameDate, setGameDate] = useState(() => localDateInputValue());
  const [tournamentName, setTournamentName] = useState("");
  const [activeTeamId, setActiveTeamId] = useState("");
  const [players, setPlayers] = useState<TeamPlayerRow[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [inviteLabel, setInviteLabel] = useState("");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [message, setMessage] = useState("Ready");
  const [authBusy, setAuthBusy] = useState(false);

  const filteredTeams = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? teams.filter((team) => team.name.toLowerCase().includes(needle)) : teams;
  }, [query, teams]);

  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const refreshTeams = async () => {
    const body = await apiFetch("/api/teams");
    setTeams(body.teams ?? []);
    if (!activeTeamId && body.teams?.[0]) setActiveTeamId(body.teams[0].id);
  };

  const refreshPlayers = async (teamId: string) => {
    if (!teamId) {
      setPlayers([]);
      return;
    }
    const body = await apiFetch(`/api/teams/${teamId}/players`);
    setPlayers(body.players ?? []);
  };

  useEffect(() => {
    createBrowserSupabaseClient()
      .auth.getSession()
      .then(({ data }) => setSessionEmail(data.session?.user.email ?? ""))
      .catch(() => setSessionEmail(""));
    void refreshTeams().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load teams"));
  }, []);

  useEffect(() => {
    void refreshPlayers(activeTeamId).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load roster"));
  }, [activeTeamId]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setMessage("Signing in...");
    try {
      if (!managerEmail.trim() || managerPassword.length < 6) {
        setMessage("Enter an email and a password with at least 6 characters.");
        return;
      }
      const { data, error } = await createBrowserSupabaseClient().auth.signInWithPassword({
        email: managerEmail.trim(),
        password: managerPassword
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setSessionEmail(data.user?.email ?? managerEmail);
      setManagerPassword("");
      await refreshTeams();
      setMessage("Signed in");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setAuthBusy(false);
    }
  };

  const createManagerAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setMessage("Creating manager account...");
    try {
      if (!managerEmail.trim() || managerPassword.length < 6) {
        setMessage("Enter an email and a password with at least 6 characters.");
        return;
      }
      if (managerPassword !== managerPasswordConfirm) {
        setMessage("Passwords do not match.");
        return;
      }
      const { data, error } = await createBrowserSupabaseClient().auth.signUp({
        email: managerEmail.trim(),
        password: managerPassword
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setSessionEmail(data.session?.user.email ?? "");
      setManagerPassword("");
      setManagerPasswordConfirm("");
      await refreshTeams();
      setMessage(data.session ? "Manager account created" : "Account created. Check your email to confirm it, then sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create manager account.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await createBrowserSupabaseClient().auth.signOut();
      setSessionEmail("");
      setMessage("Signed out");
      await refreshTeams();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign out.");
    }
  };

  const createTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const body = await apiFetch("/api/teams", {
        method: "POST",
        body: JSON.stringify({ name: newTeamName })
      });
      setNewTeamName("");
      setActiveTeamId(body.team.id);
      await refreshTeams();
      setMessage(`Created ${body.team.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create team.");
    }
  };

  const addPlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTeamId) return;
    try {
      await apiFetch(`/api/teams/${activeTeamId}/players`, {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, jerseyNumber })
      });
      setFirstName("");
      setLastName("");
      setJerseyNumber("");
      await refreshPlayers(activeTeamId);
      await refreshTeams();
      setMessage(`Added ${firstName} ${lastName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add player.");
    }
  };

  const deactivatePlayer = async (playerId: string) => {
    if (!activeTeamId) return;
    try {
      await apiFetch(`/api/teams/${activeTeamId}/players/${playerId}`, { method: "DELETE" });
      await refreshPlayers(activeTeamId);
      await refreshTeams();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove player.");
    }
  };

  const createInvite = async () => {
    if (!activeTeamId) return;
    try {
      const body = await apiFetch(`/api/teams/${activeTeamId}/invites`, {
        method: "POST",
        body: JSON.stringify({ label: inviteLabel })
      });
      setLatestInviteUrl(body.url);
      setInviteLabel("");
      setMessage("Invite link created");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create invite.");
    }
  };

  const startSharedGame = () => {
    if (!selectedTeamId || !opponentName.trim() || !gameDate) {
      setMessage("Select My Team, enter an opponent, and confirm the game date.");
      return;
    }
    const params = new URLSearchParams({
      gameId: "shared",
      teamId: selectedTeamId,
      opponentName: opponentName.trim(),
      gameDate
    });
    if (tournamentName.trim()) params.set("tournamentName", tournamentName.trim());
    router.push(`/capture?${params.toString()}`);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Frisbee Live Capture</span>
        </div>
        <nav className="nav" aria-label="Primary">
          <Link href="/review">Review</Link>
        </nav>
      </header>

      <section className="page game-select-page">
        <div className="selection-header">
          <div>
            <h1>Team Library</h1>
            <p className="muted">Create private teams, share score-only roster access, and start capture.</p>
          </div>
          <span className="status-pill neutral">{sessionEmail ? `Manager: ${sessionEmail}` : "Score-only or signed out"}</span>
        </div>

        <div className="game-selection-grid">
          <section className="panel custom-game-form">
            <div>
              <span className="status-pill neutral">Manager</span>
              <h2>{authMode === "create" ? "Create Account" : "Sign In"}</h2>
            </div>
            {sessionEmail ? (
              <button className="button full-width" type="button" onClick={signOut}>
                Sign Out
              </button>
            ) : authMode === "create" ? (
              <form onSubmit={createManagerAccount}>
                <div className="field">
                  <label htmlFor="manager-create-email">Email</label>
                  <input
                    id="manager-create-email"
                    value={managerEmail}
                    onChange={(event) => setManagerEmail(event.target.value)}
                    placeholder="manager@example.com"
                    type="email"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="manager-create-password">Password</label>
                  <input
                    id="manager-create-password"
                    value={managerPassword}
                    onChange={(event) => setManagerPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="manager-create-password-confirm">Confirm Password</label>
                  <input
                    id="manager-create-password-confirm"
                    value={managerPasswordConfirm}
                    onChange={(event) => setManagerPasswordConfirm(event.target.value)}
                    placeholder="Confirm password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <button className="button primary full-width" type="submit" disabled={authBusy}>
                  {authBusy ? "Creating..." : "Create Account"}
                </button>
                <button
                  className="button full-width"
                  type="button"
                  onClick={() => {
                    setAuthMode("signIn");
                    setMessage("Ready");
                  }}
                  disabled={authBusy}
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={signIn}>
                <div className="field">
                  <label htmlFor="manager-email">Email</label>
                  <input
                    id="manager-email"
                    value={managerEmail}
                    onChange={(event) => setManagerEmail(event.target.value)}
                    placeholder="manager@example.com"
                    type="email"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="manager-password">Password</label>
                  <input
                    id="manager-password"
                    value={managerPassword}
                    onChange={(event) => setManagerPassword(event.target.value)}
                    placeholder="Password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <button className="button primary full-width" type="submit" disabled={authBusy}>
                  {authBusy ? "Working..." : "Sign In"}
                </button>
                <button
                  className="button full-width"
                  type="button"
                  onClick={() => {
                    setAuthMode("create");
                    setMessage("Create a manager account with an email and password.");
                  }}
                  disabled={authBusy}
                >
                  Create Manager Account
                </button>
              </form>
            )}
          </section>
        </div>

        <div className="game-selection-grid">
          <section className="panel custom-game-form">
            <div>
              <span className="status-pill">Shared</span>
              <h2>Start Capture</h2>
            </div>
            <div className="field">
              <label htmlFor="team-search">Search Teams</label>
              <input id="team-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Team name" />
            </div>
            <div className="field">
              <label htmlFor="tracked-team">My Team</label>
              <select id="tracked-team" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
                <option value="">Select team</option>
                {filteredTeams.map((team) => (
                  <option key={`tracked-${team.id}`} value={team.id}>
                    {team.name} ({team.playerCount ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="opponent-name">Opponent</label>
              <input
                id="opponent-name"
                value={opponentName}
                onChange={(event) => setOpponentName(event.target.value)}
                placeholder="Opponent team name"
              />
            </div>
            <div className="field">
              <label htmlFor="game-date">Game Date</label>
              <input id="game-date" value={gameDate} onChange={(event) => setGameDate(event.target.value)} type="date" />
            </div>
            <div className="field">
              <label htmlFor="tournament-name">Tournament</label>
              <input
                id="tournament-name"
                value={tournamentName}
                onChange={(event) => setTournamentName(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <button className="button primary full-width" type="button" onClick={startSharedGame}>
              Start Capture
            </button>
          </section>

          <section className="panel custom-game-form">
            <div>
              <span className="status-pill neutral">Manager Teams</span>
              <h2>Team Setup</h2>
            </div>
            <form onSubmit={createTeam}>
              <div className="field">
                <label htmlFor="new-team">New Team</label>
                <input id="new-team" value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} placeholder="Team name" />
              </div>
              <button className="button primary full-width" type="submit">
                Create Team
              </button>
            </form>
            <div className="field">
              <label htmlFor="active-team">Roster Team</label>
              <select id="active-team" value={activeTeamId} onChange={(event) => setActiveTeamId(event.target.value)}>
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} · {team.accessRole}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>

        {activeTeam ? (
          <div className="game-selection-grid">
            <section className="panel custom-game-form">
              <div>
                <span className="status-pill">{activeTeam.accessRole}</span>
                <h2>{activeTeam.name} Roster</h2>
                <p className="muted compact-copy">{players.length} player{players.length === 1 ? "" : "s"} on this roster.</p>
              </div>
              {activeTeam.accessRole === "manager" ? (
                <form onSubmit={addPlayer}>
                  <div className="field horizontal-grid">
                    <div>
                      <label htmlFor="first-name">First</label>
                      <input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="last-name">Last</label>
                      <input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="jersey">Jersey</label>
                    <input id="jersey" value={jerseyNumber} onChange={(event) => setJerseyNumber(event.target.value)} />
                  </div>
                  <button className="button primary full-width" type="submit">
                    Add Player
                  </button>
                </form>
              ) : null}
              <div className="timeline">
                {players.map((player) => (
                  <div className="timeline-item" key={player.id}>
                    <strong>
                      {player.jersey_number ? `#${player.jersey_number} ` : ""}
                      {player.first_name} {player.last_name}
                    </strong>
                    {activeTeam.accessRole === "manager" ? (
                      <button className="button small" type="button" onClick={() => deactivatePlayer(player.id)}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="panel custom-game-form">
              <div>
                <span className="status-pill neutral">Invite</span>
                <h2>Score-Only Link</h2>
              </div>
              {activeTeam.accessRole === "manager" ? (
                <>
                  <div className="field">
                    <label htmlFor="invite-label">Label</label>
                    <input
                      id="invite-label"
                      value={inviteLabel}
                      onChange={(event) => setInviteLabel(event.target.value)}
                      placeholder="June scorer"
                    />
                  </div>
                  <button className="button primary full-width" type="button" onClick={createInvite}>
                    Create Invite
                  </button>
                  {latestInviteUrl ? (
                    <div className="field">
                      <label htmlFor="invite-url">Latest Invite URL</label>
                      <input id="invite-url" value={latestInviteUrl} readOnly />
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="muted compact-copy">Score-only access can use this roster but cannot create invites.</p>
              )}
            </section>
          </div>
        ) : null}

        <div className="game-selection-grid">
          <section className="panel game-card">
            <div>
              <span className="status-pill">Demo roster</span>
              <h2>NY Empire at Salt Lake Shred</h2>
              <p className="muted">
                {demoGame.AwayTeamID} at {demoGame.HomeTeamID} · {demoPlayers.length} players loaded
              </p>
            </div>
            <Link className="button primary full-width" href={`/capture?gameId=${demoGame.GameID}`}>
              Start Demo Capture
            </Link>
          </section>
        </div>

        <p className="muted">{message}</p>
      </section>
    </main>
  );
}
