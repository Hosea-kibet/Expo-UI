import { NextRequest } from "next/server";
import { requestAttendeeOtp } from "@/src/lib/server/attendee-otp";
import { sanitizeRegistrationInput, validatePendingRegistration } from "@/src/lib/registration";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const registration = sanitizeRegistrationInput(body);
    validatePendingRegistration(registration);

    const result = await requestAttendeeOtp(registration);

    return Response.json({
      ok: true,
      email: result.attendee.email,
      resendInSeconds: result.resendInSeconds,
      expiresInSeconds: result.expiresInSeconds,
    });
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : 400;
    const retryAfter =
      typeof error === "object" && error && "retryAfter" in error && typeof error.retryAfter === "number"
        ? error.retryAfter
        : undefined;

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to send OTP.",
        retryAfter,
      },
      { status },
    );
  }
}
