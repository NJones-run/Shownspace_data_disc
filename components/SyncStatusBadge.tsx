import type { SyncStatus } from "@/lib/event-model/types";

const labels: Record<SyncStatus, string> = {
  local: "Local",
  queued: "Queued",
  syncing: "Syncing",
  synced: "Synced",
  error: "Sync Error"
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  return <span className="status-pill">{labels[status]}</span>;
}
