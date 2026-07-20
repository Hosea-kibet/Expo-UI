import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { AttendeeRecord } from "@/src/lib/server/strapi-admin";
import { attendeeSmsAddress, sendBelioSms } from "@/src/lib/server/belio-sms";
import { createVisitorPassPdf } from "@/src/lib/server/visitor-pass";

type RegistrationAttendee = Pick<
  AttendeeRecord,
  | "firstName"
  | "lastName"
  | "phone"
  | "countryCode"
  | "fullPhoneNumber"
  | "registrationReference"
>;

type MetaWhatsAppError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_data?: { details?: string };
    fbtrace_id?: string;
  };
};

export function attendeeWhatsAppAddress(attendee: RegistrationAttendee) {
  const countryCode = String(attendee.countryCode ?? "").replace(/\D/g, "");
  const localPhone = String(attendee.phone ?? "").replace(/\D/g, "").replace(/^0/, "");
  const storedFullPhone = String(attendee.fullPhoneNumber ?? "").replace(/\D/g, "");
  const internationalCandidate = countryCode && localPhone
    ? `+${countryCode}${localPhone}`
    : storedFullPhone
      ? `+${storedFullPhone.replace(/^00/, "")}`
      : "";

  return normalizeWhatsAppRecipient(internationalCandidate);
}

function normalizeWhatsAppRecipient(value: string) {
  const phone = value.replace(/^whatsapp:/i, "").trim();
  const internationalPhone = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;
  const parsedPhone = parsePhoneNumberFromString(internationalPhone);

  if (!parsedPhone?.isValid()) {
    throw new Error("A valid international WhatsApp number is required.");
  }

  // Meta expects the E.164 recipient without the leading plus sign.
  return parsedPhone.number.slice(1);
}

function getWhatsAppConfig() {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.META_WHATSAPP_API_VERSION || "v23.0";

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      "META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID must be configured.",
    );
  }

  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    throw new Error("META_WHATSAPP_API_VERSION must use a value such as v23.0.");
  }

  return {
    accessToken,
    messagesUrl: `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    mediaUrl: `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
  };
}

async function parseMetaResponse(response: Response) {
  const text = await response.text();
  let result: unknown = {};

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { error: { message: text } };
    }
  }

  if (!response.ok) {
    const error = (result as MetaWhatsAppError).error;
    const code = error?.code ? ` (Meta ${error.code}${error.error_subcode ? `/${error.error_subcode}` : ""})` : "";
    const details = error?.error_data?.details;
    throw new Error(
      `${details || error?.message || text || `WhatsApp request failed with ${response.status}.`}${code}`,
    );
  }

  return result;
}

async function createMetaWhatsAppMessage(to: string, message: Record<string, unknown>) {
  const config = getWhatsAppConfig();
  const response = await fetch(config.messagesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizeWhatsAppRecipient(to),
      ...message,
    }),
    cache: "no-store",
  });

  return parseMetaResponse(response);
}

async function uploadRegistrationVisitorPass(attendee: RegistrationAttendee) {
  const config = getWhatsAppConfig();
  const visitorPassData = {
    visitor_name: `${attendee.firstName} ${attendee.lastName}`.trim(),
    reference_id: attendee.registrationReference,
    dates: "23–25 October 2026",
    venue: "Kenyatta International Convention Centre (KICC), Nairobi, Kenya",
  };
  const visitorPass = await createVisitorPassPdf(visitorPassData);
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append(
    "file",
    new Blob([new Uint8Array(visitorPass)], { type: "application/pdf" }),
    `AIAE-Visitor-Pass-${attendee.registrationReference}.pdf`,
  );

  const response = await fetch(config.mediaUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.accessToken}` },
    body: formData,
    cache: "no-store",
  });
  const result = await parseMetaResponse(response) as { id?: string };

  if (!result.id) {
    throw new Error("Meta uploaded the Visitor Pass PDF but did not return a media ID.");
  }

  return result.id;
}

export function registrationSmsMessage(registrationReference: string) {
  return `2026 AIAE: Your registration is confirmed!
Reference ID: ${registrationReference}
Your Visitor Pass with your QR Code has been sent to your email and WhatsApp. Please present your QR Code or Reference ID at the registration desk for entry.
23–25 October 2026 at KICC, Nairobi`;
}

export async function sendRegistrationWhatsApp(attendee: RegistrationAttendee) {
  const templateName = process.env.META_WHATSAPP_REGISTRATION_TEMPLATE_NAME;
  const languageCode = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

  if (!templateName) {
    throw new Error("META_WHATSAPP_REGISTRATION_TEMPLATE_NAME must be configured.");
  }

  const visitorPassMediaId = await uploadRegistrationVisitorPass(attendee);

  return createMetaWhatsAppMessage(attendeeWhatsAppAddress(attendee), {
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                id: visitorPassMediaId,
                filename: `AIAE-Visitor-Pass-${attendee.registrationReference}.pdf`,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: `${attendee.firstName} ${attendee.lastName}`.trim() },
            { type: "text", text: attendee.registrationReference },
          ],
        },
      ],
    },
  });
}

export async function sendWhatsAppText(message: string, recipient: string) {
  return createMetaWhatsAppMessage(recipient, {
    type: "text",
    text: { body: message, preview_url: false },
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
