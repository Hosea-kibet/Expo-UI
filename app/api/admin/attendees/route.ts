import { NextRequest, NextResponse } from "next/server";
import {
  listAttendees,
  updateAttendeeWithJwt,
} from "@/src/lib/server/strapi-admin";
import { getAdminTokenFromRequest } from "@/src/lib/server/admin-session";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const admin = await getAdminTokenFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

  try {
    const attendees = await listAttendees(admin.strapiJwt);
    return NextResponse.json({ ok: true, attendees });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load attendees.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminTokenFromRequest(request);

  if (!admin) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as {
      documentId?: string;
      attendanceStatus?: "pending" | "registered" | "confirmed";
      notes?: string;
    };

    const documentId = String(body.documentId ?? "").trim();

    if (!documentId) {
      return NextResponse.json(
        { ok: false, error: "Attendee documentId is required." },
        { status: 400 },
      );
    }

    const nextStatus =
      body.attendanceStatus && ["pending", "registered", "confirmed"].includes(body.attendanceStatus)
        ? body.attendanceStatus
        : undefined;

    const attendee = await updateAttendeeWithJwt(
      documentId,
      {
        ...(nextStatus ? { attendanceStatus: nextStatus } : {}),
        ...(body.notes !== undefined ? { notes: String(body.notes).trim() || null } : {}),
        ...(nextStatus === "confirmed"
          ? { checkedInAt: new Date().toISOString() }
          : nextStatus
            ? { checkedInAt: null }
            : {}),
      },
      admin.strapiJwt,
    );

    return NextResponse.json({ ok: true, attendee });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to update attendee.",
      },
      { status: 500 },
    );
  }
}
