import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { AttendeeRecord } from "@/src/lib/server/strapi-admin";
import { attendeeSmsAddress, sendBelioSms } from "@/src/lib/server/belio-sms";

type RegistrationAttendee = Pick<
  AttendeeRecord,
  | "firstName"
  | "lastName"
  | "phone"
  | "countryCode"
  | "fullPhoneNumber"
  | "registrationReference"
>;

export function attendeeWhatsAppAddress(attendee: RegistrationAttendee) {
  const countryCode = String(attendee.countryCode ?? "").replace(/\D/g, "");
  const localPhone = String(attendee.phone ?? "").replace(/\D/g, "").replace(/^0/, "");
  const storedFullPhone = String(attendee.fullPhoneNumber ?? "").replace(/\D/g, "");
  const internationalCandidate = countryCode && localPhone
    ? `+${countryCode}${localPhone}`
    : storedFullPhone
      ? `+${storedFullPhone.replace(/^00/, "")}`
      : "";
  const parsedPhone = parsePhoneNumberFromString(internationalCandidate);

  if (!parsedPhone?.isValid()) {
    throw new Error("The attendee phone number is not a valid international WhatsApp number.");
  }

  return `whatsapp:${parsedPhone.number}`;
}

function getWhatsAppConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const sender = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !sender) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM must be configured.",
    );
  }

  return {
    accountSid,
    authToken,
    sender: normalizeWhatsAppAddress(sender),
    messagesUrl: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
  };
}

function normalizeWhatsAppAddress(value: string) {
  const phone = value.replace(/^whatsapp:/i, "").trim();
  const internationalPhone = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;
  const parsedPhone = parsePhoneNumberFromString(internationalPhone);

  if (!parsedPhone?.isValid()) {
    throw new Error("A valid international WhatsApp number is required.");
  }

  return `whatsapp:${parsedPhone.number}`;
}

async function parseTwilioResponse(response: Response) {
  const text = await response.text();
  let result: unknown = {};

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text };
    }
  }

  if (!response.ok) {
    const error = result as { message?: string; code?: number };
    const code = error.code ? ` (Twilio ${error.code})` : "";
    throw new Error(
      `${error.message || text || `WhatsApp request failed with ${response.status}.`}${code}`,
    );
  }

  return result;
}

async function createTwilioMessage(params: Record<string, string>) {
  const config = getWhatsAppConfig();
  const body = new URLSearchParams({ From: config.sender, ...params });
  const response = await fetch(config.messagesUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  return parseTwilioResponse(response);
}

export function registrationSmsMessage(registrationReference: string) {
  return `2026 AIAE registration confirmed. Ref: ${registrationReference}. Visitor Pass sent by email. Present your QR code or reference at entry. 23-25 Oct, KICC Nairobi.`;
}

export async function sendRegistrationWhatsApp(attendee: RegistrationAttendee) {
  const contentSid = process.env.TWILIO_WHATSAPP_REGISTRATION_CONTENT_SID;
  const templateMode = process.env.TWILIO_WHATSAPP_TEMPLATE_MODE ?? "production";
  const recipient = attendeeWhatsAppAddress(attendee);

  if (!contentSid) {
    throw new Error("TWILIO_WHATSAPP_REGISTRATION_CONTENT_SID must be configured.");
  }

  const contentVariables = templateMode === "sandbox"
    ? { "1": "23 October 2026", "2": "9:00 AM" }
    : {
        "1": `${attendee.firstName} ${attendee.lastName}`.trim(),
        "2": attendee.registrationReference,
      };

  return createTwilioMessage({
    To: recipient,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(contentVariables),
  });
}

export async function sendWhatsAppText(message: string, recipient: string) {
  return createTwilioMessage({
    To: normalizeWhatsAppAddress(recipient),
    Body: message,
  });
}

export async function sendRegistrationSms(attendee: RegistrationAttendee) {
  const recipient = attendeeSmsAddress(attendee);
  return sendBelioSms(registrationSmsMessage(attendee.registrationReference), [recipient]);
}

export async function sendAttendeeRegistrationMessages(attendee: RegistrationAttendee) {
  const results = await Promise.allSettled([
    sendRegistrationSms(attendee),
    sendRegistrationWhatsApp(attendee),
  ]);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`${index === 0 ? "SMS" : "WhatsApp"} registration message failed:`, result.reason);
    }
  });

  return results;
}
