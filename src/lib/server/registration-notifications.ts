import { sendRegistrationConfirmationEmail } from "@/src/lib/server/mailer";
import { sendRegistrationSms, sendRegistrationWhatsApp } from "@/src/lib/server/attendee-messaging";
import type { AttendeeRecord } from "@/src/lib/server/strapi-admin";
import type { VisitorPassChannel, VisitorPassDelivery } from "@/src/lib/visitor-pass-resend";

// Registration and admin resends share the original content and pass reference.
export async function sendVisitorPassNotifications(attendee: AttendeeRecord): Promise<VisitorPassDelivery[]> {
  const channels: VisitorPassChannel[] = ["Email", "WhatsApp", "SMS"];
  const results = await Promise.allSettled([
    sendRegistrationConfirmationEmail({
      email: attendee.email,
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      registrationReference: attendee.registrationReference,
    }),
    sendRegistrationWhatsApp(attendee),
    sendRegistrationSms(attendee),
  ]);

  return results.map((result, index) => ({
    channel: channels[index],
    status: result.status === "fulfilled" ? "sent" : "failed",
    ...(result.status === "rejected"
      ? { error: result.reason instanceof Error ? result.reason.message : String(result.reason) }
      : {}),
  }));
}
