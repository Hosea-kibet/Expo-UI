import type { AttendeeRecord } from "@/src/lib/server/strapi-admin";

type BelioTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type BelioMessageResponse = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

type BelioSmsPayload =
  | {
      type: "SendToMany";
      message: string;
      addresses: string[];
    }
  | {
      type: "SendToEach";
      messages: Array<{ text: string; phone: string }>;
    };

function getBelioConfig() {
  const clientId = process.env.BELIO_CLIENT_ID;
  const clientSecret = process.env.BELIO_CLIENT_SECRET;
  const tokenUrl =
    process.env.BELIO_TOKEN_URL ??
    "https://account.belio.co.ke/realms/api/protocol/openid-connect/token";
  const messageBaseUrl = process.env.BELIO_MESSAGE_BASE_URL ?? "https://api.belio.co.ke/message";
  const serviceId = process.env.BELIO_SERVICE_ID;

  if (!clientId || !clientSecret) {
    throw new Error("BELIO_CLIENT_ID and BELIO_CLIENT_SECRET must be configured.");
  }

  if (!serviceId) {
    throw new Error("BELIO_SERVICE_ID must be configured.");
  }

  return {
    clientId,
    clientSecret,
    tokenUrl,
    messageUrl: `${messageBaseUrl.replace(/\/$/, "")}/${serviceId}`,
  };
}

function digitsOnly(value: string | null | undefined) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

export function attendeeSmsAddress(attendee: Pick<AttendeeRecord, "phone" | "countryCode" | "fullPhoneNumber">) {
  const localPhone = digitsOnly(attendee.phone);
  const fullPhone = digitsOnly(attendee.fullPhoneNumber);
  const countryCode = digitsOnly(attendee.countryCode);

  if (localPhone.startsWith("0")) {
    return localPhone;
  }

  if (countryCode === "254" && localPhone.length === 9) {
    return `0${localPhone}`;
  }

  if (fullPhone.startsWith("254") && fullPhone.length === 12) {
    return `0${fullPhone.slice(3)}`;
  }

  return fullPhone || localPhone;
}

export async function getBelioAccessToken() {
  const { clientId, clientSecret, tokenUrl } = getBelioConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Unable to authenticate with Belio SMS.");
  }

  const result = JSON.parse(text) as BelioTokenResponse;

  if (!result.access_token) {
    throw new Error("Belio SMS token response did not include an access token.");
  }

  return result.access_token;
}

async function sendBelioSmsRequest(payload: BelioSmsPayload) {
  const { messageUrl } = getBelioConfig();
  const accessToken = await getBelioAccessToken();

  const response = await fetch(messageUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: BelioMessageResponse | undefined;

  if (text) {
    try {
      parsed = JSON.parse(text) as BelioMessageResponse;
    } catch {
      parsed = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(parsed?.message || text || "Unable to send SMS with Belio.");
  }

  return parsed ?? {};
}

export async function sendBelioSms(
  message: string,
  recipients: string[],
) {
  if (recipients.length === 1) {
    const phone = recipients[0];

    if (!phone) {
      throw new Error("A recipient phone number is required for single SMS sends.");
    }

    return sendBelioSmsRequest({
      type: "SendToEach",
      messages: [{ text: message, phone }],
    });
  }

  return sendBelioSmsRequest({
    type: "SendToMany",
    message,
    addresses: recipients,
  });
}
