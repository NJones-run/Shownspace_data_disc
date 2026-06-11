import { NextResponse } from "next/server";
import { persistManualEventBatch } from "@/lib/supabase/manual-events";
import { manualEventBatchSchema } from "@/lib/validation/manual-event";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = manualEventBatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        acceptedClientEventIds: [],
        rejected: [{ clientEventId: "batch", reason: parsed.error.message }]
      },
      { status: 400 }
    );
  }

  try {
    const acceptedClientEventIds = await persistManualEventBatch(parsed.data);
    return NextResponse.json({
      acceptedClientEventIds,
      rejected: [],
      stagingStatus: "accepted_for_review"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to persist manual event batch";
    const missingSupabaseEnv = message.includes("Missing SUPABASE_URL");
    return NextResponse.json(
      {
        acceptedClientEventIds: [],
        rejected: parsed.data.events.map((event) => ({
          clientEventId: event.clientEventId,
          reason: message
        }))
      },
      { status: missingSupabaseEnv ? 503 : 500 }
    );
  }
}
