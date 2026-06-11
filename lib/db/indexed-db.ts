import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CaptureGame, CapturePlayer, CaptureSession, ManualEvent, SyncStatus } from "@/lib/event-model/types";

interface LiveCaptureDB extends DBSchema {
  games: {
    key: string;
    value: CaptureGame;
  };
  players: {
    key: string;
    value: CapturePlayer;
    indexes: { byTeam: string };
  };
  sessions: {
    key: string;
    value: CaptureSession;
    indexes: { byGame: string };
  };
  events: {
    key: string;
    value: ManualEvent;
    indexes: { bySession: string; byGame: string; bySyncStatus: string };
  };
}

let dbPromise: Promise<IDBPDatabase<LiveCaptureDB>> | null = null;

export function getCaptureDB() {
  if (!dbPromise) {
    dbPromise = openDB<LiveCaptureDB>("frisbee-live-capture", 1, {
      upgrade(db) {
        db.createObjectStore("games", { keyPath: "GameID" });
        const players = db.createObjectStore("players", { keyPath: "PlayerID" });
        players.createIndex("byTeam", "TeamID");
        const sessions = db.createObjectStore("sessions", { keyPath: "sessionId" });
        sessions.createIndex("byGame", "gameId");
        const events = db.createObjectStore("events", { keyPath: "clientEventId" });
        events.createIndex("bySession", "sessionId");
        events.createIndex("byGame", "gameId");
        events.createIndex("bySyncStatus", "syncStatus");
      }
    });
  }
  return dbPromise;
}

export async function saveEvent(event: ManualEvent) {
  const db = await getCaptureDB();
  await db.put("events", event);
}

export async function saveEvents(events: ManualEvent[]) {
  const db = await getCaptureDB();
  const tx = db.transaction("events", "readwrite");
  await Promise.all(events.map((event) => tx.store.put(event)));
  await tx.done;
}

export async function updateEventSyncStatus(clientEventIds: string[], syncStatus: SyncStatus) {
  if (!clientEventIds.length) return;
  const db = await getCaptureDB();
  const tx = db.transaction("events", "readwrite");
  await Promise.all(
    clientEventIds.map(async (clientEventId) => {
      const event = await tx.store.get(clientEventId);
      if (event) {
        await tx.store.put({ ...event, syncStatus });
      }
    })
  );
  await tx.done;
}

export async function listSessionEvents(sessionId: string) {
  const db = await getCaptureDB();
  return db.getAllFromIndex("events", "bySession", sessionId);
}

export async function listQueuedEvents() {
  const db = await getCaptureDB();
  return db.getAllFromIndex("events", "bySyncStatus", "queued");
}
