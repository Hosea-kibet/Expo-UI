import { NextRequest, NextResponse } from "next/server";
import {
  getActiveWelcomeMessage,
  getAttendeeByReference,
  updateAttendee,
} from "@/src/lib/server/strapi-admin";
import { getAdminTokenFromRequest } from "@/src/lib/server/admin-session";
import { sendEventWelcomeEmail } from "@/src/lib/server/mailer";
import {
  sendEventWelcomeSms,
  sendEventWelcomeWhatsApp,
} from "@/src/lib/server/attendee-messaging";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminTokenFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as {
      registrationReference?: string;
      notes?: string;
    };

    const registrationReference = String(body.registrationReference ?? "")
      .trim()
      .toUpperCase();

    if (!registrationReference) {
      return NextResponse.json(
        { ok: false, error: "Registration reference is required." },
        { status: 400 },
      );
    }

    const attendee = await getAttendeeByReference(registrationReference);

    if (!attendee) {
      return NextResponse.json(
        { ok: false, error: "No attendee matched that QR/reference." },
        { status: 404 },
      );
    }

    const payload = {
      attendanceStatus: "confirmed" as const,
      checkedInAt: attendee.checkedInAt ?? new Date().toISOString(),
      ...(body.notes !== undefined ? { notes: String(body.notes).trim() || null } : {}),
    };

    const confirmedAttendee = await updateAttendee(attendee.documentId, payload);

    if (attendee.attendanceStatus !== "confirmed" && confirmedAttendee.attendanceStatus === "confirmed") {
      try {
        const activeWelcomeMessage = await getActiveWelcomeMessage();

        if (!activeWelcomeMessage?.message.trim()) {
          throw new Error("No active CMS welcome message was found.");
        }

        const welcomeMessage = activeWelcomeMessage.message.trim();
        const notificationResults = await Promise.allSettled([
          sendEventWelcomeEmail({
            email: confirmedAttendee.email,
            firstName: confirmedAttendee.firstName,
            welcomeMessage,
          }),
          sendEventWelcomeSms(confirmedAttendee, welcomeMessage),
          sendEventWelcomeWhatsApp(confirmedAttendee, welcomeMessage),
        ]);
        const channelNames = ["email", "SMS", "WhatsApp"];

        notificationResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            console.info(
              `[welcome] ${channelNames[index]} accepted using "${activeWelcomeMessage.name}".`,
            );
            return;
          }

          const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
          console.error(`[welcome] ${channelNames[index]} failed: ${reason}`);
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`[welcome] Backend notification workflow failed: ${reason}`);
      }
    }

    return NextResponse.json({ ok: true, attendee: confirmedAttendee });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to confirm attendee.",
      },
      { status: 500 },
    );
  }
}
