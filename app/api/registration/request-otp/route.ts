import { NextRequest } from "next/server";
import { requestAttendeeOtp, resendAttendeeOtp } from "@/src/lib/server/attendee-otp";
import { sanitizeRegistrationInput, validatePendingRegistration } from "@/src/lib/registration";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = body.resend === true
      ? await resendAttendeeOtp(String(body.email ?? ""))
      : await (async () => {
          const registration = sanitizeRegistrationInput(body);
          validatePendingRegistration(registration);
          return requestAttendeeOtp(registration);
        })();

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
        : error instanceof Error && error.message.includes("already registered")
          ? 409
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
