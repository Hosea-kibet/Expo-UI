import { NextRequest, NextResponse } from "next/server";
import {
  getAttendeeByReference,
  updateAttendee,
  updateAttendeeWithJwt,
} from "@/src/lib/server/strapi-admin";
import { getAdminTokenFromRequest } from "@/src/lib/server/admin-session";

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

    const attendee = await getAttendeeByReference(
      registrationReference,
      admin.expoAccess === "admin" ? undefined : admin.strapiJwt,
    );

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

    const confirmedAttendee =
      admin.expoAccess === "admin"
        ? await updateAttendee(attendee.documentId, payload)
        : await updateAttendeeWithJwt(attendee.documentId, payload, admin.strapiJwt);

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
