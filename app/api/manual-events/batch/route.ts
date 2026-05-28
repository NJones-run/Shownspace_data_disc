import { NextResponse } from "next/server";
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

  const acceptedClientEventIds = parsed.data.events.map((event) => event.clientEventId);
  return NextResponse.json({
    acceptedClientEventIds,
    rejected: [],
    stagingStatus: "accepted_for_review"
  });
}
