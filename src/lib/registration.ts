export type PendingRegistration = {
  gender: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  company: string;
  jobTitle: string;
  consent: boolean;
};

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function normalizeLocalPhone(phone: string, countryCode?: string) {
  let normalized = normalizePhone(phone);
  const normalizedCountryCode = normalizePhone(countryCode ?? "");

  if (normalizedCountryCode && normalized.startsWith(normalizedCountryCode)) {
    normalized = normalized.slice(normalizedCountryCode.length);
  }

  if (normalized.startsWith("0") && normalized.length > 7) {
    normalized = normalized.slice(1);
  }

  return normalized;
}

export function sanitizeRegistrationInput(input: Partial<PendingRegistration>): PendingRegistration {
  const countryCode = String(input.countryCode ?? "").trim();

  return {
    gender: String(input.gender ?? "").trim(),
    firstName: String(input.firstName ?? "").trim(),
    lastName: String(input.lastName ?? "").trim(),
    countryCode,
    phone: normalizeLocalPhone(String(input.phone ?? "").trim(), countryCode),
    email: String(input.email ?? "")
      .trim()
      .toLowerCase(),
    country: String(input.country ?? "").trim(),
    city: String(input.city ?? "").trim(),
    company: String(input.company ?? "").trim(),
    jobTitle: String(input.jobTitle ?? "").trim(),
    consent: Boolean(input.consent),
  };
}

export function validatePendingRegistration(input: PendingRegistration) {
  const requiredFields: Array<keyof PendingRegistration> = [
    "gender",
    "firstName",
    "lastName",
    "countryCode",
    "phone",
    "email",
    "country",
    "city",
  ];

  for (const field of requiredFields) {
    if (!input[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!input.consent) {
    throw new Error("Consent is required.");
  }

  if (!/^\S+@\S+\.\S+$/.test(input.email)) {
    throw new Error("Invalid email address.");
  }

  if (normalizeLocalPhone(input.phone, input.countryCode).length < 7) {
    throw new Error("Invalid phone number.");
  }
}
