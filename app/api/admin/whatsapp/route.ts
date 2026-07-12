import { NextRequest, NextResponse } from "next/server";
import {
  attendeeWhatsAppAddress,
  sendWhatsAppText,
} from "@/src/lib/server/attendee-messaging";
import {
  getAttendeeByDocumentId,
  listAttendees,
  type AttendeeRecord,
} from "@/src/lib/server/strapi-admin";
import { getAdminTokenFromRequest } from "@/src/lib/server/admin-session";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}

async function listAllAttendees() {
  const attendees: AttendeeRecord[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const result = await listAttendees(undefined, { page, pageSize: 100, search: "" });
    attendees.push(...result.attendees);
    pageCount = result.pagination.pageCount;
    page += 1;
  } while (page <= pageCount);

  return attendees;
}

export async function POST(request: NextRequest) {
  const admin = await getAdminTokenFromRequest(request);
  if (!admin) return unauthorized();

  try {
    const body = (await request.json()) as {
      mode?: "all" | "single";
      attendeeDocumentId?: string;
      message?: string;
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
      attendees = await listAllAttendees();
    }

    const recipients = new Map<string, AttendeeRecord>();
    attendees.forEach((attendee) => {
      const address = attendeeWhatsAppAddress(attendee);
      if (address) recipients.set(address, attendee);
    });

    if (recipients.size === 0) {
      return NextResponse.json({ ok: false, error: "No valid WhatsApp numbers were found." }, { status: 400 });
    }

    const results = await Promise.allSettled(
      [...recipients.keys()].map((recipient) => sendWhatsAppText(message, recipient)),
    );
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
