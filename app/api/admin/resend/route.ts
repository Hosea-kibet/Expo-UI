import { NextRequest, NextResponse } from "next/server";
import { getAdminTokenFromRequest } from "@/src/lib/server/admin-session";
import { getAttendeeByDocumentId } from "@/src/lib/server/strapi-admin";
import { sendVisitorPassNotifications } from "@/src/lib/server/registration-notifications";
import { VISITOR_PASS_RESEND_BATCH_SIZE, type VisitorPassResendResult } from "@/src/lib/visitor-pass-resend";

export async function POST(request: NextRequest) {
  const admin = await getAdminTokenFromRequest(request);
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  let body: { attendeeDocumentIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const ids = body?.attendeeDocumentIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > VISITOR_PASS_RESEND_BATCH_SIZE ||
      ids.some((id) => typeof id !== "string" || !id.trim())) {
    return NextResponse.json({ ok: false, error: `Select between 1 and ${VISITOR_PASS_RESEND_BATCH_SIZE} attendees per request.` }, { status: 400 });
  }

  const results = await Promise.all(
    [...new Set(ids.map((id: string) => id.trim()))].map(async (documentId): Promise<VisitorPassResendResult> => {
      try {
        // Always use persisted contact details and the original pass reference.
        const attendee = await getAttendeeByDocumentId(documentId);
        if (!attendee) return { documentId, deliveries: [], error: "Attendee not found." };
        const identity = {
          documentId,
          name: `${attendee.firstName} ${attendee.lastName}`.trim(),
          registrationReference: attendee.registrationReference,
        };
        if (attendee.registrationStatus !== "verified" || !attendee.registrationReference?.trim()) {
          return { ...identity, deliveries: [], error: "This attendee does not have a verified Visitor Pass." };
        }
        return { ...identity, deliveries: await sendVisitorPassNotifications(attendee) };
      } catch (error) {
        return { documentId, deliveries: [], error: error instanceof Error ? error.message : "Unable to resend this Visitor Pass." };
      }
    }),
  );
  return NextResponse.json({ ok: true, results });
}
