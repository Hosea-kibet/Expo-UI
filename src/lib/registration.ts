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

export function sanitizeRegistrationInput(input: Partial<PendingRegistration>): PendingRegistration {
  return {
    gender: String(input.gender ?? "").trim(),
    firstName: String(input.firstName ?? "").trim(),
    lastName: String(input.lastName ?? "").trim(),
    countryCode: String(input.countryCode ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
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

  if (normalizePhone(input.phone).length < 7) {
    throw new Error("Invalid phone number.");
  }
}
