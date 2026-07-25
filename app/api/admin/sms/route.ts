import { NextRequest, NextResponse } from "next/server";
import { attendeeSmsAddress, sendBelioSms } from "@/src/lib/server/belio-sms";
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

function uniqueRecipientAddresses(attendees: AttendeeRecord[]) {
  const seen = new Set<string>();
  const addresses: string[] = [];

  for (const attendee of attendees) {
    const address = attendeeSmsAddress(attendee).trim();

    if (!address || seen.has(address)) {
      continue;
    }

    seen.add(address);
    addresses.push(address);
  }

  return addresses;
}

export async function POST(request: NextRequest) {
  const admin = await getAdminTokenFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

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
      return NextResponse.json(
        { ok: false, error: "Message is required." },
        { status: 400 },
      );
    }

    let recipients: AttendeeRecord[] = [];

    if (mode === "single") {
      if (!attendeeDocumentId) {
        return NextResponse.json(
          { ok: false, error: "Select an attendee before sending a direct SMS." },
          { status: 400 },
        );
      }

      const attendee = await getAttendeeByDocumentId(attendeeDocumentId);

      if (!attendee) {
        return NextResponse.json(
          { ok: false, error: "Selected attendee was not found." },
          { status: 404 },
        );
      }

      recipients = [attendee];
    } else {
      recipients = filterAttendeesForMessage(
        await listAllAttendees(),
        body.filters,
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No attendees match the selected blast filters." },
        { status: 400 },
      );
    }

    const addresses = uniqueRecipientAddresses(recipients);

    if (addresses.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid attendee phone numbers were found for this send." },
        { status: 400 },
      );
    }

    const providerResponse =
      mode === "single"
        ? await sendBelioSms(message, [addresses[0]])
        : await sendBelioSms(message, addresses);

    return NextResponse.json({
      ok: true,
      mode,
      recipientCount: addresses.length,
      attendeeCount: recipients.length,
      providerResponse,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to send SMS.",
      },
      { status: 500 },
    );
  }
}
