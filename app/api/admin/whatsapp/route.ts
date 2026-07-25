import { NextRequest, NextResponse } from "next/server";
import {
  attendeeWhatsAppAddress,
  sendWhatsAppText,
} from "@/src/lib/server/attendee-messaging";
import {
  getAttendeeByDocumentId,
  listAllAttendees,
  type AttendeeRecord,
} from "@/src/lib/server/strapi-admin";
import { getAdminTokenFromRequest } from "@/src/lib/server/admin-session";
import {
  filterAttendeesForMessage,
  type AttendeeMessageFilters,
} from "@/src/lib/attendee-message-filters";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}

async function sendWhatsAppInBatches(message: string, recipients: string[]) {
  const results: PromiseSettledResult<unknown>[] = [];
  const batchSize = 20;

  for (let index = 0; index < recipients.length; index += batchSize) {
    const batch = recipients.slice(index, index + batchSize);
    results.push(
      ...(await Promise.allSettled(
        batch.map((recipient) => sendWhatsAppText(message, recipient)),
      )),
    );
  }

  return results;
}

export async function POST(request: NextRequest) {
  const admin = await getAdminTokenFromRequest(request);
  if (!admin) return unauthorized();

  try {
    const body = (await request.json()) as {
      mode?: "all" | "single";
      attendeeDocumentId?: string;
      message?: string;
      filters?: Partial<AttendeeMessageFilters>;
    };
    const mode = body.mode === "single" ? "single" : "all";
    const message = String(body.message ?? "").trim();
    const attendeeDocumentId = String(body.attendeeDocumentId ?? "").trim();

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
    }

    let attendees: AttendeeRecord[];
    if (mode === "single") {
      if (!attendeeDocumentId) {
        return NextResponse.json({ ok: false, error: "Select an attendee first." }, { status: 400 });
      }
      const attendee = await getAttendeeByDocumentId(attendeeDocumentId);
      if (!attendee) {
        return NextResponse.json({ ok: false, error: "Selected attendee was not found." }, { status: 404 });
      }
      attendees = [attendee];
    } else {
      attendees = filterAttendeesForMessage(
        await listAllAttendees(),
        body.filters,
      );
    }

    if (attendees.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No attendees match the selected blast filters." },
        { status: 400 },
      );
    }

    const recipients = new Map<string, AttendeeRecord>();
    attendees.forEach((attendee) => {
      try {
        const address = attendeeWhatsAppAddress(attendee);
        recipients.set(address, attendee);
      } catch {
        // Invalid attendee phone numbers are excluded from bulk sends.
      }
    });

    if (recipients.size === 0) {
      return NextResponse.json({ ok: false, error: "No valid WhatsApp numbers were found." }, { status: 400 });
    }

    const results = await sendWhatsAppInBatches(message, [...recipients.keys()]);
    const sentCount = results.filter((result) => result.status === "fulfilled").length;
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));

    if (sentCount === 0) {
      return NextResponse.json(
        { ok: false, error: errors[0] || "WhatsApp rejected every message." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      mode,
      recipientCount: sentCount,
      failedCount: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to send WhatsApp message." },
      { status: 500 },
    );
  }
}
