import type { PendingRegistration } from "@/src/lib/registration";
import { generateOtpCode, hashOtp, verifyOtpHash } from "@/src/lib/server/otp";
import {
  sendRegistrationConfirmationEmail,
  sendRegistrationOtpEmail,
} from "@/src/lib/server/mailer";
import {
  sendRegistrationSms,
  sendRegistrationWhatsApp,
} from "@/src/lib/server/attendee-messaging";
import {
  attendeePayloadFromRegistration,
  createAttendee,
  getAttendeeByEmail,
  updateAttendee,
} from "@/src/lib/server/strapi-admin";

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function secondsSince(dateString?: string | null) {
  if (!dateString) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
}

export async function requestAttendeeOtp(registration: PendingRegistration) {
  const attendee = await getAttendeeByEmail(registration.email);
  const secondsFromLastSend = secondsSince(attendee?.otpLastSentAt);

  if (secondsFromLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
    const retryAfter = OTP_RESEND_COOLDOWN_SECONDS - secondsFromLastSend;
    const error = new Error(`Please wait ${retryAfter} seconds before requesting another code.`);
    (error as Error & { status?: number; retryAfter?: number }).status = 429;
    (error as Error & { status?: number; retryAfter?: number }).retryAfter = retryAfter;
    throw error;
  }

  if (attendee?.registrationStatus === "verified") {
    const error = new Error("This email address is already registered.");
    (error as Error & { status?: number }).status = 409;
    throw error;
  }

  const otp = generateOtpCode();
  const { hash, salt } = hashOtp(otp);
  const now = new Date();
  const expiresAt = addMinutes(now, OTP_EXPIRY_MINUTES).toISOString();

  const otpData = {
    otpHash: hash,
    otpSalt: salt,
    otpExpiresAt: expiresAt,
    otpLastSentAt: now.toISOString(),
    otpAttemptCount: 0,
    otpUsedAt: null,
    registrationStatus: "pending-verification",
    attendanceStatus: "pending",
  } as const;

  const savedAttendee = attendee
    ? await updateAttendee(
        attendee.documentId,
        attendeePayloadFromRegistration(registration, otpData),
      )
    : await createAttendee(
        attendeePayloadFromRegistration(registration, {
          ...otpData,
          registeredAt: now.toISOString(),
        }),
      );

  await sendRegistrationOtpEmail({
    email: registration.email,
    firstName: registration.firstName,
    otp,
  });

  return {
    attendee: savedAttendee,
    expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    resendInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export async function resendAttendeeOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const attendee = await getAttendeeByEmail(normalizedEmail);

  if (!attendee) {
    const error = new Error("We couldn't find the registration details previously provided.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const secondsFromLastSend = secondsSince(attendee.otpLastSentAt);

  if (secondsFromLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
    const retryAfter = OTP_RESEND_COOLDOWN_SECONDS - secondsFromLastSend;
    const error = new Error(`Please wait ${retryAfter} seconds before requesting another code.`);
    (error as Error & { status?: number; retryAfter?: number }).status = 429;
    (error as Error & { status?: number; retryAfter?: number }).retryAfter = retryAfter;
    throw error;
  }

  if (attendee.registrationStatus === "verified") {
    const error = new Error("This email address is already registered.");
    (error as Error & { status?: number }).status = 409;
    throw error;
  }

  const otp = generateOtpCode();
  const { hash, salt } = hashOtp(otp);
  const now = new Date();
  const expiresAt = addMinutes(now, OTP_EXPIRY_MINUTES).toISOString();

  const savedAttendee = await updateAttendee(attendee.documentId, {
    otpHash: hash,
    otpSalt: salt,
    otpExpiresAt: expiresAt,
    otpLastSentAt: now.toISOString(),
    otpAttemptCount: 0,
    otpUsedAt: null,
  });

  await sendRegistrationOtpEmail({
    email: savedAttendee.email,
    firstName: savedAttendee.firstName,
    otp,
  });

  return {
    attendee: savedAttendee,
    expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    resendInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export async function verifyAttendeeOtp(email: string, otp: string) {
  const attendee = await getAttendeeByEmail(email);

  if (!attendee) {
    return null;
  }

  if (attendee.otpUsedAt) {
    return null;
  }

  if (!attendee.otpHash || !attendee.otpSalt || !attendee.otpExpiresAt) {
    return null;
  }

  const currentAttempts = attendee.otpAttemptCount ?? 0;

  if (currentAttempts >= OTP_MAX_ATTEMPTS) {
    return null;
  }

  if (new Date(attendee.otpExpiresAt).getTime() < Date.now()) {
    return null;
  }

  const isValid = verifyOtpHash(otp, attendee.otpHash, attendee.otpSalt);

  if (!isValid) {
    await updateAttendee(attendee.documentId, {
      otpAttemptCount: currentAttempts + 1,
    });
    return null;
  }

  const verifiedAttendee = await updateAttendee(attendee.documentId, {
    registrationStatus: "verified",
    attendanceStatus: "registered",
    otpUsedAt: new Date().toISOString(),
    otpHash: null,
    otpSalt: null,
    otpExpiresAt: null,
    otpAttemptCount: currentAttempts + 1,
  });

  const notificationResults = await Promise.allSettled([
    sendRegistrationConfirmationEmail({
      email: verifiedAttendee.email,
      firstName: verifiedAttendee.firstName,
      lastName: verifiedAttendee.lastName,
      registrationReference: verifiedAttendee.registrationReference,
    }),
    sendRegistrationSms(verifiedAttendee),
    sendRegistrationWhatsApp(verifiedAttendee),
  ]);

  const channels = ["Email", "SMS", "WhatsApp"];
  notificationResults.forEach((result, index) => {
    if (result.status === "rejected") {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`[registration] ${channels[index]} failed independently: ${message}`);
    } else {
      console.info(`[registration] ${channels[index]} sent successfully.`);
    }
  });

  return verifiedAttendee;
}
