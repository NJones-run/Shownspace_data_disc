import type { ManualEventType } from "./types";

interface RecordEventRuleInput {
  eventType: ManualEventType;
  actorPlayerId?: string;
  targetPlayerId?: string;
  hasFieldCoordinate: boolean;
  clockRequired?: boolean;
  clockSet?: boolean;
}

export function getRecordEventBlockReason({
  eventType,
  actorPlayerId,
  targetPlayerId,
  hasFieldCoordinate,
  clockRequired = false,
  clockSet = true
}: RecordEventRuleInput) {
  const requiresFieldCoord = ["throw", "tipped_self_catch"].includes(eventType);
  const requiresReceiver = eventType === "throw";
  const requiresActor = ["throw", "tipped_self_catch", "drop", "block", "turnover", "penalty"].includes(eventType);

  if (eventType === "throw" && actorPlayerId && targetPlayerId && actorPlayerId === targetPlayerId) {
    return "Use Tipped Self Catch for a thrower catching their own tipped disc.";
  }
  if ((requiresReceiver && (!actorPlayerId || !targetPlayerId)) || (requiresActor && !actorPlayerId)) {
    return "Select the required player before recording this event.";
  }
  if (requiresFieldCoord && !hasFieldCoordinate) {
    return "Select a field coordinate before recording this event.";
  }
  if (clockRequired && eventType === "throw" && !clockSet) {
    return "Set the game clock for this possession before recording throws.";
  }
  return null;
}
