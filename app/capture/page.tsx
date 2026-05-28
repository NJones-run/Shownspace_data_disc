"use client";

import { useMemo, useReducer, useState, type MouseEvent } from "react";
import Link from "next/link";
import { captureReducer } from "@/lib/event-model/reducer";
import { createDemoState, demoLinePresets } from "@/lib/event-model/fixtures";
import type { CapturePlayer, ManualEventType, TeamSide } from "@/lib/event-model/types";

const eventButtons: Array<{ label: string; eventType: ManualEventType; teamSide?: TeamSide }> = [
  { label: "Point Start", eventType: "point_start" },
  { label: "Pull", eventType: "pull" },
  { label: "Throw", eventType: "throw" },
  { label: "Catch", eventType: "catch" },
  { label: "Drop", eventType: "drop" },
  { label: "Block", eventType: "block" },
  { label: "Turnover", eventType: "turnover" },
  { label: "Home Goal", eventType: "goal", teamSide: "home" },
  { label: "Away Goal", eventType: "goal", teamSide: "away" },
  { label: "Line Change", eventType: "line_change" },
  { label: "Penalty", eventType: "penalty" },
  { label: "Timeout", eventType: "timeout" }
];

export default function CapturePage() {
  const initialState = useMemo(() => createDemoState(), []);
  const [state, dispatch] = useReducer(captureReducer, initialState);
  const [selectedOffenseLine, setSelectedOffenseLine] = useState<string[]>([]);
  const [selectedDefenseLine, setSelectedDefenseLine] = useState<string[]>([]);
  const [selectedThrower, setSelectedThrower] = useState<string>("");
  const [selectedReceiver, setSelectedReceiver] = useState<string>("");
  const [selectedFieldCoordinate, setSelectedFieldCoordinate] = useState<{ x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState(eventButtons[2]);
  const [recordingTeam, setRecordingTeam] = useState<TeamSide>(state.possessionTeamSide);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(demoLinePresets?.[0]?.id ?? "");
  const unsynced = state.events.filter((event) => event.syncStatus !== "synced").length;
  const requiresFieldCoord = ["throw", "catch"].includes(selectedEvent.eventType);
  const recordDisabled = requiresFieldCoord && !selectedFieldCoordinate;

  const playersById = useMemo(
    () => new Map(state.players.map((player) => [player.PlayerID, player])),
    [state.players]
  );

  const playerLabel = (player?: CapturePlayer) =>
    player ? `${player.JerseyNumber ? `#${player.JerseyNumber} ` : ""}${player.FirstName} ${player.LastName}` : "Unknown player";

  const playerName = (playerId?: string) => {
    if (!playerId) return "";
    const player = playersById.get(playerId);
    return player ? playerLabel(player) : playerId;
  };

  const lineLabels = (playerIds?: string[]) =>
    playerIds?.map(playerName).filter(Boolean).join(", ") ?? "";

  const toggleLineSelection = (playerId: string, line: "offense" | "defense") => {
    const selected = line === "offense" ? selectedOffenseLine : selectedDefenseLine;
    const setter = line === "offense" ? setSelectedOffenseLine : setSelectedDefenseLine;
    if (selected.includes(playerId)) {
      setter(selected.filter((id) => id !== playerId));
    } else {
      setter([...selected, playerId]);
    }
  };

  const onFieldClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setSelectedFieldCoordinate({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Live Capture</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/games">Games</Link>
          <Link href="/review">Review</Link>
        </nav>
      </header>

      <section className="page">
        <div className="scoreboard">
          <div className="team-score">
            <span className="muted">{state.game.AwayTeamID}</span>
            <strong>{state.game.AwayScore}</strong>
          </div>
          <div>
            <span className="status-pill">{unsynced} local</span>
          </div>
          <div className="team-score">
            <span className="muted">{state.game.HomeTeamID}</span>
            <strong>{state.game.HomeScore}</strong>
          </div>
        </div>

        <div className="grid">
          <aside className="panel">
            <h2>Game State</h2>
            <p className="muted">{state.game.GameID}</p>
            <div className="field">
              <label>Start Possession</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={recordingTeam} onChange={(e) => setRecordingTeam(e.target.value as TeamSide)}>
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </select>
                <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)}>
                  <option value="">Select preset</option>
                  {demoLinePresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    const preset = demoLinePresets.find((p) => p.id === selectedPresetId);
                    const offensive = preset ? preset.playerIds : [];
                    setSelectedOffenseLine(offensive);
                    dispatch({
                      type: "record_event",
                      eventType: "possession_start",
                      teamSide: recordingTeam,
                      offensiveLinePlayerIds: offensive,
                      payload: {}
                    });
                  }}
                >
                  Start Possession
                </button>
              </div>
            </div>
              <label>Quarter</label>
              <input readOnly value={state.quarter} />
            </div>
            <div className="field">
              <label>Point</label>
              <input readOnly value={state.pointNumber} />
            </div>
            <div className="field">
              <label>Possession</label>
              <input readOnly value={`${state.possessionTeamSide} #${state.possessionNumber}`} />
            </div>
            <button className="button danger" onClick={() => dispatch({ type: "undo_last" })}>
              Undo Last
            </button>
          </aside>

          <section className="panel">
            <h1>Event Entry</h1>
            <div className="field">
              <label>Offensive line</label>
              <div className="player-selection">
                {state.players.map((player) => (
                  <label key={`offense-${player.PlayerID}`} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedOffenseLine.includes(player.PlayerID)}
                      onChange={() => toggleLineSelection(player.PlayerID, "offense")}
                    />
                    {playerLabel(player)}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Defensive line</label>
              <div className="player-selection">
                {state.players.map((player) => (
                  <label key={`defense-${player.PlayerID}`} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedDefenseLine.includes(player.PlayerID)}
                      onChange={() => toggleLineSelection(player.PlayerID, "defense")}
                    />
                    {playerLabel(player)}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Thrower</label>
              <select value={selectedThrower} onChange={(event) => setSelectedThrower(event.target.value)}>
                <option value="">Select thrower</option>
                {state.players.map((player) => (
                  <option key={`thrower-${player.PlayerID}`} value={player.PlayerID}>
                    {playerLabel(player)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Field position</label>
              <div className="field-map" onClick={onFieldClick} role="button" aria-label="Select field position">
                <img src="/field-diagram.svg" alt="Field diagram" className="field-map-image" />
                {selectedFieldCoordinate ? (
                  <div
                    className="field-map-marker"
                    style={{ left: `${selectedFieldCoordinate.x}%`, top: `${selectedFieldCoordinate.y}%` }}
                  />
                ) : (
                  <div className="field-map-hint">Click to place throw/catch location</div>
                )}
              </div>
              <div className="field-map-coords">
                {selectedFieldCoordinate ? `x: ${selectedFieldCoordinate.x}%, y: ${selectedFieldCoordinate.y}%` : "No location selected"}
                {selectedFieldCoordinate ? (
                  <button type="button" className="button small" onClick={() => setSelectedFieldCoordinate(null)}>
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
            <div className="field event-type-picker">
              <label>Outcome</label>
              <div className="event-buttons">
                {eventButtons.map((button) => (
                  <button
                    key={`${button.eventType}-${button.label}`}
                    type="button"
                    className={button.eventType === selectedEvent.eventType ? "selected" : ""}
                    onClick={() => setSelectedEvent(button)}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field horizontal-grid">
              <div>
                <label>{selectedEvent.eventType === "throw" ? "Thrower" : "Player"}</label>
                <select value={selectedThrower} onChange={(event) => setSelectedThrower(event.target.value)}>
                  <option value="">Select player</option>
                  {state.players.map((player) => (
                    <option key={`player-${player.PlayerID}`} value={player.PlayerID}>
                      {playerLabel(player)}
                    </option>
                  ))}
                </select>
              </div>
              {selectedEvent.eventType === "throw" ? (
                <div>
                  <label>Receiver</label>
                  <select value={selectedReceiver} onChange={(event) => setSelectedReceiver(event.target.value)}>
                    <option value="">Select receiver</option>
                    {state.players.map((player) => (
                      <option key={`receiver-${player.PlayerID}`} value={player.PlayerID}>
                        {playerLabel(player)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
            <button
              className="button primary full-width"
              type="button"
              disabled={recordDisabled}
              onClick={() => {
                const actorForDispatch = selectedEvent.eventType === "catch" ? selectedThrower || undefined : undefined;
                const targetForDispatch = selectedEvent.eventType === "throw" ? selectedReceiver || undefined : undefined;
                dispatch({
                  type: "record_event",
                  eventType: selectedEvent.eventType,
                  teamSide: selectedEvent.teamSide,
                  actorPlayerId: actorForDispatch,
                  targetPlayerId: targetForDispatch,
                  offensiveLinePlayerIds: selectedEvent.eventType === "point_start" ? selectedOffenseLine : undefined,
                  defensiveLinePlayerIds: selectedEvent.eventType === "point_start" ? selectedDefenseLine : undefined,
                  fieldX: ["throw", "catch"].includes(selectedEvent.eventType) ? selectedFieldCoordinate?.x : undefined,
                  fieldY: ["throw", "catch"].includes(selectedEvent.eventType) ? selectedFieldCoordinate?.y : undefined,
                  payload: {}
                });
                setSelectedFieldCoordinate(null);
              }}
            >
              Record {selectedEvent.label}
            </button>
            {recordDisabled ? (
              <div className="muted" style={{ marginTop: 8 }}>
                Select a field coordinate before recording this event.
              </div>
            ) : null}
          </section>

          <aside className="panel">
            <h2>Timeline</h2>
            <div className="timeline">
              {state.events.length === 0 ? (
                <p className="muted">No events recorded yet.</p>
              ) : (
                state.events
                  .slice()
                  .reverse()
                  .map((event) => (
                    <div className="timeline-item" key={event.clientEventId}>
                      <strong>#{event.eventSeq} {event.eventType}</strong>
                      <div className="muted">
                        {event.awayScore}-{event.homeScore} · Q{event.quarter} P{event.pointNumber} · {event.syncStatus}
                      </div>
                      {event.offensiveLinePlayerIds || event.defensiveLinePlayerIds ? (
                        <div className="timeline-meta">
                          {event.offensiveLinePlayerIds ? <div>Offense: {lineLabels(event.offensiveLinePlayerIds)}</div> : null}
                          {event.defensiveLinePlayerIds ? <div>Defense: {lineLabels(event.defensiveLinePlayerIds)}</div> : null}
                        </div>
                      ) : null}
                      {(event.eventType === "throw" || event.eventType === "catch") ? (
                        <div className="timeline-meta">
                          {event.actorPlayerId ? <div>Thrower: {playerName(event.actorPlayerId)}</div> : null}
                          {event.targetPlayerId ? <div>Receiver: {playerName(event.targetPlayerId)}</div> : null}
                          {event.fieldX !== undefined && event.fieldY !== undefined ? (
                            <div>Location: x {event.fieldX}%, y {event.fieldY}%</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
