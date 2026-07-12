import QRCode from "qrcode";
import sharp from "sharp";
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

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function attendeeWhatsAppAddress(attendee: RegistrationAttendee) {
  const fullPhone = String(attendee.fullPhoneNumber ?? "").replace(/\D/g, "");

  if (fullPhone) return fullPhone;

  const countryCode = String(attendee.countryCode ?? "").replace(/\D/g, "");
  const localPhone = String(attendee.phone ?? "").replace(/\D/g, "").replace(/^0/, "");
  return `${countryCode}${localPhone}`;
}

function getWhatsAppConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;

  if (!accessToken || !phoneNumberId || !graphApiVersion) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_GRAPH_API_VERSION must be configured.",
    );
  }

  return {
    accessToken,
    phoneNumberId,
    baseUrl: `https://graph.facebook.com/${graphApiVersion}`,
  };
}

async function parseMetaResponse(response: Response) {
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
    const error = result as { error?: { message?: string } };
    throw new Error(error.error?.message || text || `WhatsApp request failed with ${response.status}.`);
  }

  return result;
}

export function registrationSmsMessage(registrationReference: string) {
  return [
    "2026 AIAE: Your registration is confirmed!",
    `Reference ID: ${registrationReference}`,
    "Your Visitor Pass with your QR Code has been sent to your email and WhatsApp. Please present your QR Code or Reference ID at the registration desk for entry.",
    "23–25 October 2026 at KICC, Nairobi",
  ].join("\n");
}

export function registrationWhatsAppCaption(attendee: RegistrationAttendee) {
  return [
    "🎉 Registration Successful!",
    `Dear ${attendee.firstName} ${attendee.lastName},`,
    "",
    "Thank you for registering for the 2026 Africa International Agricultural Expo (AIAE).",
    "",
    "Your Visitor Pass, containing your QR Code and Reference ID, is attached to this message.",
    "",
    "Event Details",
    "📅 Dates: 23–25 October 2026",
    "📍 Venue: Kenyatta International Convention Center (KICC), Nairobi, Kenya",
    "",
    "Kindly present your QR Code or Reference ID at the registration desk for quick entry into the exhibition and conference areas.",
    "",
    "We look forward to welcoming you to the 2026 AIAE!",
    "",
    "Agri-Africa Exhibition Limited",
  ].join("\n");
}

export async function createVisitorPassPng(attendee: RegistrationAttendee) {
  const qrCode = await QRCode.toBuffer(attendee.registrationReference, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 560,
    color: { dark: "#173422", light: "#ffffff" },
  });
  const qrData = qrCode.toString("base64");
  const fullName = escapeXml(`${attendee.firstName} ${attendee.lastName}`.trim());
  const reference = escapeXml(attendee.registrationReference);
  const svg = `
    <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1350" fill="#f4efe4"/>
      <rect x="60" y="60" width="960" height="1230" rx="32" fill="#ffffff"/>
      <path d="M60 92a32 32 0 0 1 32-32h896a32 32 0 0 1 32 32v258H60z" fill="#173422"/>
      <rect x="60" y="334" width="960" height="16" fill="#e26f2d"/>
      <text x="110" y="132" fill="#f2a36f" font-family="Arial,sans-serif" font-size="28" letter-spacing="5">VISITOR PASS</text>
      <text x="110" y="205" fill="#ffffff" font-family="Arial,sans-serif" font-size="45" font-weight="700">2026 Africa International</text>
      <text x="110" y="265" fill="#ffffff" font-family="Arial,sans-serif" font-size="45" font-weight="700">Agricultural Expo (AIAE)</text>
      <text x="540" y="415" text-anchor="middle" fill="#173422" font-family="Arial,sans-serif" font-size="34" font-weight="700">${fullName}</text>
      <image href="data:image/png;base64,${qrData}" x="260" y="455" width="560" height="560"/>
      <text x="540" y="1065" text-anchor="middle" fill="#64736a" font-family="Arial,sans-serif" font-size="24" letter-spacing="4">REFERENCE ID</text>
      <text x="540" y="1130" text-anchor="middle" fill="#173422" font-family="Arial,sans-serif" font-size="54" font-weight="700" letter-spacing="6">${reference}</text>
      <line x1="150" y1="1175" x2="930" y2="1175" stroke="#d8dfd9" stroke-width="2"/>
      <text x="540" y="1225" text-anchor="middle" fill="#173422" font-family="Arial,sans-serif" font-size="28" font-weight="700">23–25 October 2026</text>
      <text x="540" y="1265" text-anchor="middle" fill="#425466" font-family="Arial,sans-serif" font-size="23">KICC, Nairobi, Kenya</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function uploadWhatsAppMedia(image: Buffer, filename: string) {
  const config = getWhatsAppConfig();
  const form = new FormData();
  form.set("messaging_product", "whatsapp");
  form.set("type", "image/png");
  form.set("file", new Blob([new Uint8Array(image)], { type: "image/png" }), filename);

  const response = await fetch(`${config.baseUrl}/${config.phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.accessToken}` },
    body: form,
    cache: "no-store",
  });
  const result = (await parseMetaResponse(response)) as { id?: string };

  if (!result.id) throw new Error("WhatsApp media upload did not return a media ID.");
  return result.id;
}

export async function sendRegistrationWhatsApp(attendee: RegistrationAttendee) {
  const config = getWhatsAppConfig();
  const recipient = attendeeWhatsAppAddress(attendee);

  if (!recipient) throw new Error("A valid attendee phone number is required for WhatsApp.");

  const pass = await createVisitorPassPng(attendee);
  const mediaId = await uploadWhatsAppMedia(pass, `${attendee.registrationReference}-visitor-pass.png`);
  const response = await fetch(`${config.baseUrl}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "image",
      image: { id: mediaId, caption: registrationWhatsAppCaption(attendee) },
    }),
    cache: "no-store",
  });

  return parseMetaResponse(response);
}

export async function sendWhatsAppText(message: string, recipient: string) {
  const config = getWhatsAppConfig();
  const normalizedRecipient = recipient.replace(/\D/g, "");

  if (!normalizedRecipient) throw new Error("A valid WhatsApp recipient is required.");

  const response = await fetch(`${config.baseUrl}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedRecipient,
      type: "text",
      text: { preview_url: false, body: message },
    }),
    cache: "no-store",
  });

  return parseMetaResponse(response);
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
