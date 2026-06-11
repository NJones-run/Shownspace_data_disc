import { listQueuedEvents, updateEventSyncStatus } from "@/lib/db/indexed-db";
import type { ManualEvent } from "@/lib/event-model/types";

export interface SyncResult {
  acceptedClientEventIds: string[];
  rejected: Array<{ clientEventId: string; reason: string }>;
}

export async function pushQueuedEvents(sessionId: string, gameId: string): Promise<SyncResult> {
  const events = (await listQueuedEvents()).filter((event) => event.sessionId === sessionId);
  if (!events.length) {
    return { acceptedClientEventIds: [], rejected: [] };
  }

  const response = await fetch("/api/manual-events/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, gameId, events })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as SyncResult | null;
    const firstReason = body?.rejected[0]?.reason;
    throw new Error(firstReason ? `Sync failed: ${response.status} ${firstReason}` : `Sync failed: ${response.status}`);
  }

  return response.json() as Promise<SyncResult>;
}

export async function markQueuedEventsSynced(clientEventIds: string[]) {
  await updateEventSyncStatus(clientEventIds, "synced");
}

export async function queueEventsForSync(clientEventIds: string[]) {
  await updateEventSyncStatus(clientEventIds, "queued");
}

export function eventsToSyncPayload(events: ManualEvent[]) {
  return events.map((event) => ({
    ...event,
    syncStatus: "queued"
  }));
}
