export const ENQUIRY_OPTIONS = [
  "Visitor Enquiry",
  "Exhibitor Enquiry",
  "Partner Enquiry",
  "Media Enquiry",
  "General Enquiry",
] as const;

export type ContactEnquiryType = (typeof ENQUIRY_OPTIONS)[number];

export type ContactEnquiryInput = {
  name: string;
  email: string;
  enquiryType: string;
  message: string;
};

export function isContactEnquiryType(value: string): value is ContactEnquiryType {
  return ENQUIRY_OPTIONS.some((option) => option === value);
}

export function sanitizeContactEnquiryInput(
  input: Partial<{
    name: unknown;
    email: unknown;
    enquiryType: unknown;
    message: unknown;
  }>,
): ContactEnquiryInput {
  const enquiryType = String(input.enquiryType ?? "").trim();

  return {
    name: String(input.name ?? "").trim(),
    email: String(input.email ?? "")
      .trim()
      .toLowerCase(),
    enquiryType,
    message: String(input.message ?? "").trim(),
  };
}

export function validateContactEnquiryInput(input: ContactEnquiryInput) {
  if (!input.name) {
    throw new Error("Full name is required.");
  }

  if (!input.email) {
    throw new Error("Email address is required.");
  }

  if (!/^\S+@\S+\.\S+$/.test(input.email)) {
    throw new Error("Invalid email address.");
  }

  if (!isContactEnquiryType(input.enquiryType)) {
    throw new Error("Select a valid enquiry type.");
  }

  if (!input.message) {
    throw new Error("Message is required.");
  }

  if (input.message.length < 10) {
    throw new Error("Message must be at least 10 characters long.");
  }
}
