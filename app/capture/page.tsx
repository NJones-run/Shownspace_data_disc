"use client";

import { Suspense, useEffect, useMemo, useReducer, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { saveEvents, updateEventSyncStatus } from "@/lib/db/indexed-db";
import { EMPTY_CLOCK_INPUT, formatClock, maskClockInput, parseClock } from "@/lib/event-model/clock";
import { getCurrentPossessionTrace } from "@/lib/event-model/field-trace";
import { getRecordEventBlockReason } from "@/lib/event-model/recording-rules";
import { captureReducer } from "@/lib/event-model/reducer";
import { createCaptureState, createCustomState, createDemoState, demoGame, demoLinePresets } from "@/lib/event-model/fixtures";
import { seedLinePresets, togglePresetPlayer, type LinePresetsByTeam } from "@/lib/event-model/line-presets";
import type { CapturePlayer, CaptureState, ManualEvent, ManualEventType, RulesMode, TeamSide } from "@/lib/event-model/types";
import { markQueuedEventsSynced, pushQueuedEvents } from "@/lib/sync/queue";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { scorerTokenHeader } from "@/lib/team-library/client-access";

const CLOCK_START_SECONDS = 15 * 60;
const FIELD_ASPECT_RATIO = 2;
type ThrowSelectionStep = "thrower" | "receiver";

const eventButtons: Array<{ label: string; eventType: ManualEventType; teamSide?: TeamSide }> = [
  { label: "Throw", eventType: "throw" },
  { label: "Tipped Self Catch", eventType: "tipped_self_catch" },
  { label: "Drop", eventType: "drop" },
  { label: "Block", eventType: "block" },
  { label: "Turnover", eventType: "turnover" },
  { label: "Goal", eventType: "goal" },
  { label: "Pull", eventType: "pull" },
  { label: "Line Change", eventType: "line_change" },
  { label: "Timeout", eventType: "timeout" },
  { label: "Penalty", eventType: "penalty" }
];

interface RecordEventOptions {
  actorPlayerId?: string;
  targetPlayerId?: string;
  fieldCoordinate?: { x: number; y: number } | null;
}

function createInitialState(gameId: string | null, awayTeam: string | null, homeTeam: string | null): CaptureState {
  if (gameId === "custom") {
    return createCustomState(awayTeam ?? "Away", homeTeam ?? "Home");
  }
  if (gameId === "shared") {
    return createCustomState("Away", "Home");
  }
  return createDemoState();
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function createInitialLinePresets(isDemoGame: boolean): LinePresetsByTeam {
  const homeSeed = isDemoGame ? demoLinePresets.find((preset) => preset.id === "shred-offense")?.playerIds ?? [] : [];
  const awaySeed = isDemoGame ? demoLinePresets.find((preset) => preset.id === "empire-offense")?.playerIds ?? [] : [];
  return seedLinePresets(homeSeed, awaySeed);
}

function CapturePageContent() {
  const searchParams = useSearchParams();
  const initialState = useMemo(
    () => createInitialState(searchParams.get("gameId"), searchParams.get("away"), searchParams.get("home")),
    [searchParams]
  );
  const [state, dispatch] = useReducer(captureReducer, initialState);
  const isDemoGame = state.game.GameID === demoGame.GameID;
  const [recordingTeam, setRecordingTeam] = useState<TeamSide>("home");
  const [linePresets, setLinePresets] = useState<LinePresetsByTeam>(() => createInitialLinePresets(isDemoGame));
  const [activeLineId, setActiveLineId] = useState("line-1");
  const [editingLines, setEditingLines] = useState(false);
  const [selectedActor, setSelectedActor] = useState<string>("");
  const [selectedReceiver, setSelectedReceiver] = useState<string>("");
  const [selectedFieldCoordinate, setSelectedFieldCoordinate] = useState<{ x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState(eventButtons[0]);
  const [throwSelectionStep, setThrowSelectionStep] = useState<ThrowSelectionStep>("thrower");
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(false);
  const [clockInput, setClockInput] = useState("");
  const [eventClockInputs, setEventClockInputs] = useState<Record<string, string>>({});
  const [syncAfterGoal, setSyncAfterGoal] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Ready");
  const [isSyncing, setIsSyncing] = useState(false);
  const persistedEventIds = useRef(new Set<string>());
  const unsynced = state.events.filter((event) => event.syncStatus !== "synced").length;
  const clockEnabled = state.rulesMode === "ufa";
  const possessionClock = state.gameClockSecondsRemaining;
  const recordBlockReason = getRecordEventBlockReason({
    eventType: selectedEvent.eventType,
    actorPlayerId: selectedActor || undefined,
    targetPlayerId: selectedReceiver || undefined,
    hasFieldCoordinate: Boolean(selectedFieldCoordinate),
    clockRequired: clockEnabled,
    clockSet: possessionClock !== undefined
  });
  const recordDisabled = Boolean(recordBlockReason);
  const tracePoints = useMemo(() => getCurrentPossessionTrace(state.events), [state.events]);

  useEffect(() => {
    if (searchParams.get("gameId") !== "shared") return;
    const teamId = searchParams.get("teamId");
    const opponentName = searchParams.get("opponentName");
    const gameDate = searchParams.get("gameDate");
    const tournamentName = searchParams.get("tournamentName");
    if (!teamId || !opponentName || !gameDate) return;

    const loadSharedGame = async () => {
      const headers: Record<string, string> = {};
      const tokens = scorerTokenHeader();
      if (tokens) headers["x-scorer-tokens"] = tokens;
      try {
        const session = await createBrowserSupabaseClient().auth.getSession();
        const accessToken = session.data.session?.access_token;
        if (accessToken) headers.authorization = `Bearer ${accessToken}`;
      } catch {
        // Public env vars are optional for score-only invite users.
      }
      const params = new URLSearchParams({ teamId, opponentName, gameDate });
      if (tournamentName) params.set("tournamentName", tournamentName);
      const response = await fetch(`/api/game-package/shared?${params.toString()}`, { headers });
      if (!response.ok) {
        setSyncMessage(`Unable to load shared teams: ${response.status}`);
        return;
      }
      const packageData = await response.json();
      dispatch({ type: "replace_state", state: createCaptureState(packageData.game, packageData.players) });
      setLinePresets(seedLinePresets([], []));
      setRecordingTeam("home");
      setSelectedActor("");
      setSelectedReceiver("");
      setThrowSelectionStep("thrower");
      setSelectedFieldCoordinate(null);
    };

    void loadSharedGame();
  }, [searchParams]);

  useEffect(() => {
    if (!clockEnabled) {
      setClockInput("");
      return;
    }
    setClockInput(possessionClock !== undefined ? formatClock(possessionClock) : EMPTY_CLOCK_INPUT);
  }, [clockEnabled, possessionClock]);

  useEffect(() => {
    setEventClockInputs((current) => {
      const next = { ...current };
      state.events.forEach((event) => {
        if (!(event.clientEventId in next)) {
          next[event.clientEventId] =
            event.gameClockSecondsRemaining !== undefined ? formatClock(event.gameClockSecondsRemaining) : EMPTY_CLOCK_INPUT;
        }
      });
      return next;
    });
  }, [state.events]);

  useEffect(() => {
    const newEvents = state.events.filter((event) => !persistedEventIds.current.has(event.clientEventId));
    if (!newEvents.length) return;

    newEvents.forEach((event) => persistedEventIds.current.add(event.clientEventId));
    saveEvents(newEvents).catch((error) => {
      newEvents.forEach((event) => persistedEventIds.current.delete(event.clientEventId));
      setSyncMessage(error instanceof Error ? error.message : "Unable to save events locally");
    });
  }, [state.events]);

  const playersById = useMemo(
    () => new Map(state.players.map((player) => [player.PlayerID, player])),
    [state.players]
  );

  const playersByTeam = useMemo(
    () => ({
      away: state.players.filter((player) => player.TeamID === state.game.AwayTeamID),
      home: state.players.filter((player) => player.TeamID === state.game.HomeTeamID)
    }),
    [state.players, state.game.AwayTeamID, state.game.HomeTeamID]
  );
  const recordingTeamPlayers = playersByTeam[recordingTeam];
  const activeTeamPresets = linePresets[recordingTeam];
  const activePreset = activeTeamPresets.find((preset) => preset.id === activeLineId) ?? activeTeamPresets[0];
  const activeLinePlayerIds = activePreset?.playerIds ?? [];

  const activePlayers = useMemo(
    () =>
      uniqueIds(activeLinePlayerIds)
        .map((playerId) => playersById.get(playerId))
        .filter((player): player is CapturePlayer => Boolean(player)),
    [activeLinePlayerIds, playersById]
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

  const displayTeamName = (side: TeamSide) =>
    side === "home"
      ? state.game.homeTeamName ?? "My Team"
      : state.game.awayTeamName ?? state.game.opponentName ?? "Opponent";
  const teamLabel = (side: TeamSide) => `${side === "home" ? "My Team" : "Opponent"} · ${displayTeamName(side)}`;
  const shortTeamLabel = (side: TeamSide) => `${side === "home" ? "My Team" : "Opponent"} · ${displayTeamName(side)}`;

  const changeRecordingTeam = (teamSide: TeamSide) => {
    setRecordingTeam(teamSide);
    setActiveLineId("line-1");
    setSelectedActor("");
    setSelectedReceiver("");
    setThrowSelectionStep("thrower");
  };

  const chooseActivePreset = (presetId: string) => {
    setActiveLineId(presetId);
    setSelectedActor("");
    setSelectedReceiver("");
    setThrowSelectionStep("thrower");
  };

  const togglePresetSelection = (presetId: string, playerId: string) => {
    setLinePresets((current) => ({
      ...current,
      [recordingTeam]: current[recordingTeam].map((preset) =>
        preset.id === presetId ? { ...preset, playerIds: togglePresetPlayer(preset.playerIds, playerId) } : preset
      )
    }));
    if (presetId === activeLineId) {
      setSelectedActor("");
      setSelectedReceiver("");
      setThrowSelectionStep("thrower");
    }
  };

  const hasAutoRecordDetails = (
    eventType: ManualEventType,
    actorPlayerId: string,
    targetPlayerId: string,
    fieldCoordinate: { x: number; y: number } | null
  ) => {
    if (eventType === "throw") {
      return Boolean(actorPlayerId && targetPlayerId && actorPlayerId !== targetPlayerId && fieldCoordinate);
    }
    if (eventType === "tipped_self_catch") {
      return Boolean(actorPlayerId && fieldCoordinate);
    }
    return Boolean(actorPlayerId);
  };

  const chooseEvent = (button: typeof eventButtons[number]) => {
    setSelectedEvent(button);
    if (button.eventType === "throw") {
      setThrowSelectionStep("thrower");
    }
  };

  const selectPlayer = (playerId: string) => {
    let nextActor = selectedActor;
    let nextReceiver = selectedReceiver;

    if (selectedEvent.eventType === "throw" && throwSelectionStep === "receiver") {
      if (playerId === selectedActor) {
        nextActor = "";
        nextReceiver = "";
        setThrowSelectionStep("thrower");
      } else {
        nextReceiver = selectedReceiver === playerId ? "" : playerId;
      }
      setSelectedActor(nextActor);
      setSelectedReceiver(nextReceiver);
    } else {
      nextActor = selectedActor === playerId ? "" : playerId;
      nextReceiver = selectedReceiver === playerId ? "" : selectedReceiver;
      setSelectedActor(nextActor);
      setSelectedReceiver(nextReceiver);
      if (selectedEvent.eventType === "throw") {
        setThrowSelectionStep(nextActor ? "receiver" : "thrower");
      }
    }

    if (
      autoRecordEnabled &&
      hasAutoRecordDetails(selectedEvent.eventType, nextActor, nextReceiver, selectedFieldCoordinate)
    ) {
      recordEvent({ actorPlayerId: nextActor, targetPlayerId: nextReceiver, fieldCoordinate: selectedFieldCoordinate });
    }
  };

  const onFieldClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerAspect = rect.width / rect.height;
    const imageWidth = containerAspect > FIELD_ASPECT_RATIO ? rect.height * FIELD_ASPECT_RATIO : rect.width;
    const imageHeight = containerAspect > FIELD_ASPECT_RATIO ? rect.height : rect.width / FIELD_ASPECT_RATIO;
    const imageLeft = rect.left + (rect.width - imageWidth) / 2;
    const imageTop = rect.top + (rect.height - imageHeight) / 2;
    const x = ((event.clientX - imageLeft) / imageWidth) * 100;
    const y = ((event.clientY - imageTop) / imageHeight) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    const nextCoordinate = { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    setSelectedFieldCoordinate(nextCoordinate);
    if (
      autoRecordEnabled &&
      ["throw", "tipped_self_catch"].includes(selectedEvent.eventType) &&
      hasAutoRecordDetails(selectedEvent.eventType, selectedActor, selectedReceiver, nextCoordinate)
    ) {
      recordEvent({ fieldCoordinate: nextCoordinate });
    }
  };

  const recordEvent = (options: RecordEventOptions = {}) => {
    const eventType = selectedEvent.eventType;
    const fieldCoordinate = options.fieldCoordinate !== undefined ? options.fieldCoordinate : selectedFieldCoordinate;
    const actorForDispatch = (options.actorPlayerId ?? selectedActor) || undefined;
    const targetForDispatch = eventType === "throw" ? (options.targetPlayerId ?? selectedReceiver) || undefined : undefined;
    const blockReason = getRecordEventBlockReason({
      eventType,
      actorPlayerId: actorForDispatch,
      targetPlayerId: targetForDispatch,
      hasFieldCoordinate: Boolean(fieldCoordinate),
      clockRequired: clockEnabled,
      clockSet: possessionClock !== undefined
    });
    if (blockReason) {
      setSyncMessage(blockReason);
      return;
    }
    const possessionBoundary = ["block", "goal", "turnover"].includes(eventType);
    dispatch({
      type: "record_event",
      eventType,
      teamSide: selectedEvent.teamSide ?? recordingTeam,
      actorPlayerId: actorForDispatch,
      targetPlayerId: targetForDispatch,
      offensiveLinePlayerIds: eventType === "pull" ? activeLinePlayerIds : undefined,
      fieldX: ["throw", "tipped_self_catch"].includes(eventType) ? fieldCoordinate?.x : undefined,
      fieldY: ["throw", "tipped_self_catch"].includes(eventType) ? fieldCoordinate?.y : undefined,
      gameClockSecondsRemaining: clockEnabled ? possessionClock : undefined,
      payload: eventType === "tipped_self_catch" ? { eventNote: "tipped_self_catch" } : {}
    });
    if (eventType === "goal" && autoRecordEnabled) {
      setSyncAfterGoal(true);
    }
    setSelectedFieldCoordinate(null);
    if (eventType === "throw" && targetForDispatch) {
      setSelectedActor(targetForDispatch);
      setSelectedReceiver("");
      setThrowSelectionStep("receiver");
    } else if (possessionBoundary) {
      setSelectedFieldCoordinate(null);
      setSelectedReceiver("");
      setThrowSelectionStep("thrower");
    }
  };

  const endPossession = () => {
    dispatch({
      type: "record_event",
      eventType: "possession_end",
      teamSide: recordingTeam,
      gameClockSecondsRemaining: clockEnabled ? possessionClock : undefined,
      payload: {}
    });
    setSelectedFieldCoordinate(null);
    setSelectedReceiver("");
  };

  const setRulesMode = (rulesMode: RulesMode) => {
    dispatch({ type: "set_rules_mode", rulesMode });
    if (rulesMode === "club") {
      dispatch({ type: "set_game_clock", secondsRemaining: undefined });
    }
  };

  const updateClockFromInput = () => {
    const nextClock = parseClock(clockInput);
    if (nextClock === undefined) {
      setSyncMessage("Enter clock as MM:SS.");
      return;
    }
    dispatch({ type: "set_game_clock", secondsRemaining: nextClock });
    setSyncMessage(`Clock updated to ${formatClock(nextClock)}`);
  };

  const editEventClock = async (event: ManualEvent) => {
    const input = eventClockInputs[event.clientEventId] ?? "";
    const nextClock = parseClock(input);
    if (nextClock === undefined) {
      setSyncMessage("Enter event clock as MM:SS.");
      return;
    }
    const updatedEvent = {
      ...event,
      gameClockSecondsRemaining: nextClock,
      syncStatus: event.syncStatus === "synced" ? "local" as const : event.syncStatus
    };
    dispatch({ type: "edit_event_clock", clientEventId: event.clientEventId, secondsRemaining: nextClock });
    await saveEvents([updatedEvent]);
    setSyncMessage(`Updated event #${event.eventSeq} clock`);
  };

  const syncEvents = async () => {
    const eventsToSync = state.events.filter((event) => event.syncStatus !== "synced");
    if (!eventsToSync.length) {
      setSyncMessage("No events to sync");
      return;
    }

    const clientEventIds = eventsToSync.map((event) => event.clientEventId);
    const queuedEvents = eventsToSync.map((event) => ({ ...event, syncStatus: "queued" as const }));
    setIsSyncing(true);
    setSyncMessage(`Syncing ${queuedEvents.length} event${queuedEvents.length === 1 ? "" : "s"}...`);
    dispatch({ type: "mark_queued", clientEventIds });

    try {
      await saveEvents(queuedEvents);
      const result = await pushQueuedEvents(state.session);
      if (result.acceptedClientEventIds.length) {
        dispatch({ type: "mark_synced", clientEventIds: result.acceptedClientEventIds });
        await markQueuedEventsSynced(result.acceptedClientEventIds);
      }

      const rejectedIds = result.rejected.map((event) => event.clientEventId).filter((id) => id !== "batch");
      if (rejectedIds.length) {
        dispatch({ type: "mark_error", clientEventIds: rejectedIds });
        await updateEventSyncStatus(rejectedIds, "error");
      }

      setSyncMessage(
        result.rejected.length
          ? `Synced ${result.acceptedClientEventIds.length}, rejected ${result.rejected.length}`
          : `Synced ${result.acceptedClientEventIds.length} event${result.acceptedClientEventIds.length === 1 ? "" : "s"}`
      );
    } catch (error) {
      dispatch({ type: "mark_error", clientEventIds });
      await updateEventSyncStatus(clientEventIds, "error");
      setSyncMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!syncAfterGoal) return;
    setSyncAfterGoal(false);
    void syncEvents();
  }, [syncAfterGoal, state.events]);

  const effectiveThrowStep: ThrowSelectionStep =
    selectedEvent.eventType === "throw" && selectedActor && throwSelectionStep === "receiver" ? "receiver" : "thrower";
  const pickerRole = selectedEvent.eventType === "throw" && effectiveThrowStep === "receiver" ? "receiver" : "actor";
  const playerActionLabel =
    selectedEvent.eventType === "throw"
      ? effectiveThrowStep === "receiver"
        ? "Action: Select Receiver"
        : "Action: Select Thrower"
      : selectedEvent.eventType === "tipped_self_catch"
      ? "Action: Select Recovering Player"
      : "Action: Select Player";
  const selectedThrowerLabel = selectedActor ? playerName(selectedActor) : "None";
  const selectedReceiverLabel = selectedReceiver ? playerName(selectedReceiver) : "None";

  const renderPlayerActionPicker = () => (
    <div className="player-action-picker">
      <div>
        <h3>{playerActionLabel}</h3>
        {selectedEvent.eventType === "throw" ? (
          <p className="muted compact-copy">
            Thrower: {selectedThrowerLabel} · Receiver: {selectedReceiverLabel}
          </p>
        ) : null}
      </div>
      {activePlayers.length === 0 ? (
        <p className="muted compact-copy">Select active line players to enable player tagging.</p>
      ) : (
        <div className="active-player-grid player-action-grid">
          {activePlayers.map((player) => {
            const isCurrentThrower = selectedEvent.eventType === "throw" && pickerRole === "receiver" && player.PlayerID === selectedActor;
            const selectedId = pickerRole === "receiver" ? selectedReceiver : selectedActor;
            return (
              <button
                key={`player-action-${player.PlayerID}`}
                type="button"
                className={`player-box compact player-action-tile ${selectedId === player.PlayerID || isCurrentThrower ? "selected" : ""}`}
                onClick={() => selectPlayer(player.PlayerID)}
              >
                <strong>{player.JerseyNumber ? `#${player.JerseyNumber}` : "--"}</strong>
                <span>{player.FirstName} {player.LastName}</span>
                {isCurrentThrower ? <small>Thrower · tap to clear</small> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Live Capture</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/">Games</Link>
          <Link href="/review">Review</Link>
        </nav>
      </header>

      <section className="capture-page">
        <div className="capture-workspace">
          <section className="capture-main">
            <div className="game-state-strip">
              <span>{state.game.GameID}</span>
              <span>{state.rulesMode === "ufa" ? "UFA clock" : "Club rules"}</span>
              <span>Q{state.quarter === 5 ? "OT" : state.quarter}</span>
              <span>Point {state.pointNumber}</span>
              <span>Possession {state.possessionNumber}: {teamLabel(state.possessionTeamSide)}</span>
              <span>{unsynced} local</span>
            </div>

            <section className="panel capture-section compact-line-panel">
              <div className="section-heading-row">
                <div>
                  <h2>Active Line</h2>
                  <p className="muted compact-subtitle">Recording for {teamLabel(recordingTeam)}</p>
                </div>
                <div className="segmented-control" aria-label="Recording team">
                  <button
                    type="button"
                    className={recordingTeam === "home" ? "selected" : ""}
                    onClick={() => changeRecordingTeam("home")}
                  >
                    My Team · {displayTeamName("home")}
                  </button>
                  <button
                    type="button"
                    className={recordingTeam === "away" ? "selected" : ""}
                    onClick={() => changeRecordingTeam("away")}
                  >
                    Opponent · {displayTeamName("away")}
                  </button>
                </div>
              </div>

              <div className="line-preset-grid">
                {activeTeamPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`line-preset-button ${activeLineId === preset.id ? "selected" : ""}`}
                    onClick={() => chooseActivePreset(preset.id)}
                  >
                    <strong>{preset.label}</strong>
                    <span>{preset.playerIds.length}/7 players</span>
                  </button>
                ))}
              </div>

              {activePlayers.length === 0 ? (
                <p className="muted compact-copy">Choose a line preset or open Edit Lines to set who is on the field.</p>
              ) : (
                <div className="active-line-strip">
                  {activePlayers.map((player) => (
                    <div key={`active-${player.PlayerID}`} className="player-box active-display">
                      <strong>{player.JerseyNumber ? `#${player.JerseyNumber}` : "--"}</strong>
                      <span>{player.FirstName} {player.LastName}</span>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" className="button full-width" onClick={() => setEditingLines((open) => !open)}>
                {editingLines ? "Hide Line Editor" : "Edit Lines"}
              </button>

              {editingLines ? (
                <div className="line-editor-drawer">
                  {recordingTeamPlayers.length === 0 ? (
                    <p className="muted compact-copy">
                      {recordingTeam === "away" ? "Opponent roster is not tracked for this capture." : "No roster loaded for this team."}
                    </p>
                  ) : (
                    activeTeamPresets.map((preset) => (
                      <div key={`editor-${preset.id}`} className="line-editor-slot">
                        <div className="section-heading-row">
                          <h3>{preset.label}</h3>
                          <span className="muted">{preset.playerIds.length}/7 selected</span>
                        </div>
                        <div className="player-box-grid compact-roster">
                          {recordingTeamPlayers.map((player) => {
                            const selected = preset.playerIds.includes(player.PlayerID);
                            const disabled = !selected && preset.playerIds.length >= 7;
                            return (
                              <button
                                key={`${preset.id}-${player.PlayerID}`}
                                type="button"
                                className={`player-box ${selected ? "selected" : ""}`}
                                disabled={disabled}
                                onClick={() => togglePresetSelection(preset.id, player.PlayerID)}
                              >
                                <strong>{player.JerseyNumber ? `#${player.JerseyNumber}` : "--"}</strong>
                                <span>{player.FirstName} {player.LastName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </section>

            <div className="field-entry-row">
              <section className="panel event-rail-panel">
                <h2>Events</h2>
                <div className="event-buttons event-rail">
                  {eventButtons.map((button) => (
                    <button
                      key={`${button.eventType}-${button.label}`}
                      type="button"
                      className={
                        button.eventType === selectedEvent.eventType && (button.teamSide ?? null) === (selectedEvent.teamSide ?? null)
                          ? "selected"
                          : ""
                      }
                      onClick={() => chooseEvent(button)}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel capture-section field-panel">
                <div className="section-heading-row">
                  <h1>Field Position</h1>
                  <div className="field-map-coords">
                    {selectedFieldCoordinate ? `x: ${selectedFieldCoordinate.x}%, y: ${selectedFieldCoordinate.y}%` : "No location selected"}
                    {selectedFieldCoordinate ? (
                      <button type="button" className="button small" onClick={() => setSelectedFieldCoordinate(null)}>
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="field-map large" onClick={onFieldClick} role="button" aria-label="Select field position">
                  <img src="/field-diagram.svg" alt="Field diagram" className="field-map-image" />
                  <svg className="field-trace-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {tracePoints.length > 1 ? (
                      <polyline
                        points={tracePoints.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke="rgba(254,243,199,0.9)"
                        strokeWidth="0.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </svg>
                  {tracePoints.map((point, index) => (
                    <div
                      key={`${point.eventSeq}-${point.eventType}`}
                      className={`field-trace-dot ${point.eventType}`}
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    >
                      {index + 1}
                    </div>
                  ))}
                  {selectedFieldCoordinate ? (
                    <div
                      className="field-map-marker pending"
                      style={{ left: `${selectedFieldCoordinate.x}%`, top: `${selectedFieldCoordinate.y}%` }}
                    >
                      {tracePoints.length + 1}
                    </div>
                  ) : (
                    <div className="field-map-hint">Tap the field to place throw location</div>
                  )}
                </div>
              </section>
            </div>

            <section className="panel capture-section player-action-panel">
              <h2>Player Selection</h2>

              {renderPlayerActionPicker()}

              <button className="button primary record-button" type="button" disabled={recordDisabled} onClick={() => recordEvent()}>
                Record {selectedEvent.label}
              </button>
              {recordDisabled ? (
                <div className="muted" style={{ marginTop: 8 }}>
                  {recordBlockReason}
                </div>
              ) : null}
            </section>
          </section>

          <aside className="capture-side-rail">
            <section className="panel side-status-card compact-clock-card">
              <span className="muted">Rules Mode</span>
              <div className="segmented-control full-width" aria-label="Rules mode">
                <button type="button" className={state.rulesMode === "ufa" ? "selected" : ""} onClick={() => setRulesMode("ufa")}>
                  UFA
                </button>
                <button type="button" className={state.rulesMode === "club" ? "selected" : ""} onClick={() => setRulesMode("club")}>
                  Club
                </button>
              </div>
              {clockEnabled ? (
                <>
                  <span className="muted">Possession Clock</span>
                  <strong>{possessionClock !== undefined ? formatClock(possessionClock) : "--:--"}</strong>
                  <div className="clock-update-row">
                    <input
                      aria-label="Set possession clock"
                      value={clockInput}
                      onChange={(event) => setClockInput(maskClockInput(event.target.value))}
                      onFocus={() => setClockInput((current) => current || EMPTY_CLOCK_INPUT)}
                      inputMode="numeric"
                      placeholder={EMPTY_CLOCK_INPUT}
                    />
                    <button type="button" className="button" onClick={updateClockFromInput}>
                      Set Clock
                    </button>
                  </div>
                  <div className="clock-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        dispatch({ type: "set_game_clock", secondsRemaining: CLOCK_START_SECONDS });
                        setSyncMessage("Possession clock set to 15:00");
                      }}
                    >
                      15:00
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        dispatch({ type: "set_game_clock", secondsRemaining: undefined });
                        setSyncMessage("Possession clock cleared");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted compact-copy">Game clock is off for club rules.</p>
              )}
            </section>

            <section className="panel side-status-card compact-score-card">
              <span className="muted">Score</span>
              <div className="compact-score-grid">
                <div>
                  <span>Opponent · {displayTeamName("away")}</span>
                  <strong>{state.game.AwayScore}</strong>
                </div>
                <div>
                  <span>My Team · {displayTeamName("home")}</span>
                  <strong>{state.game.HomeScore}</strong>
                </div>
              </div>
            </section>

            <section className="panel side-controls-card">
              <label className={`auto-record-control ${autoRecordEnabled ? "enabled" : ""}`}>
                <span>Auto Record</span>
                <input
                  type="checkbox"
                  checked={autoRecordEnabled}
                  onChange={(event) => setAutoRecordEnabled(event.target.checked)}
                />
              </label>
              <label className="quarter-control side-quarter-control">
                <span>Quarter</span>
                <select
                  value={state.quarter}
                  onChange={(event) => dispatch({ type: "set_quarter", quarter: Number(event.target.value) })}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>OT</option>
                </select>
              </label>
              <button className="button full-width" onClick={endPossession}>
                End Possession
              </button>
              <button className="button danger full-width" onClick={() => dispatch({ type: "undo_last" })}>
                Undo Last
              </button>
              <button className="button primary full-width" onClick={syncEvents} disabled={isSyncing || unsynced === 0}>
                {isSyncing ? "Syncing..." : `Sync ${unsynced}`}
              </button>
              <p className="muted compact-copy">{syncMessage}</p>
            </section>

            <section className="panel event-log-panel">
              <h2>Event Log</h2>
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
                          Opponent {event.awayScore} · My Team {event.homeScore} · Q{event.quarter} P{event.pointNumber} · Poss {event.possessionNumber}
                        </div>
                        <div className="timeline-meta">
                          {clockEnabled ? (
                            <div className="event-clock-edit">
                              <span>Clock</span>
                              <input
                                aria-label={`Edit clock for event ${event.eventSeq}`}
                                value={eventClockInputs[event.clientEventId] ?? ""}
                                onChange={(inputEvent) =>
                                  setEventClockInputs((current) => ({
                                    ...current,
                                    [event.clientEventId]: maskClockInput(inputEvent.target.value)
                                  }))
                                }
                                onFocus={() =>
                                  setEventClockInputs((current) => ({
                                    ...current,
                                    [event.clientEventId]: current[event.clientEventId] || EMPTY_CLOCK_INPUT
                                  }))
                                }
                                inputMode="numeric"
                                placeholder={EMPTY_CLOCK_INPUT}
                              />
                              <button type="button" className="button small" onClick={() => editEventClock(event)}>
                                Save
                              </button>
                            </div>
                          ) : null}
                          <div>Team: {event.teamSide ? shortTeamLabel(event.teamSide) : "Unknown"}</div>
                          {event.actorPlayerId ? <div>Player: {playerName(event.actorPlayerId)}</div> : null}
                          {event.targetPlayerId ? <div>Receiver: {playerName(event.targetPlayerId)}</div> : null}
                          {event.offensiveLinePlayerIds ? <div>Offense: {lineLabels(event.offensiveLinePlayerIds)}</div> : null}
                          {event.defensiveLinePlayerIds ? <div>Defense: {lineLabels(event.defensiveLinePlayerIds)}</div> : null}
                          {event.fieldX !== undefined && event.fieldY !== undefined ? (
                            <div>Location: x {event.fieldX}%, y {event.fieldY}%</div>
                          ) : null}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<main className="app-shell"><section className="page">Loading capture...</section></main>}>
      <CapturePageContent />
    </Suspense>
  );
}
