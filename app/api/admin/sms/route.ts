import { NextRequest, NextResponse } from "next/server";
import { attendeeSmsAddress, sendBelioSms } from "@/src/lib/server/belio-sms";
import {
  getAttendeeByDocumentId,
  listAttendees,
  type AttendeeRecord,
} from "@/src/lib/server/strapi-admin";
import { getAdminTokenFromRequest } from "@/src/lib/server/admin-session";

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

async function listAllAttendees() {
  const attendees: AttendeeRecord[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const result = await listAttendees(undefined, {
      page,
      pageSize: 100,
      search: "",
    });

    attendees.push(...result.attendees);
    pageCount = result.pagination.pageCount;
    page += 1;
  } while (page <= pageCount);

  return attendees;
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
      recipients = await listAllAttendees();
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
