import type { PendingRegistration } from "@/src/lib/registration";
import { normalizeLocalPhone, normalizePhone } from "@/src/lib/registration";

export type AttendeeRecord = {
  id: number;
  documentId: string;
  registrationReference: string;
  registrationStatus: "pending-verification" | "verified";
  attendanceStatus: "pending" | "registered" | "confirmed";
  registeredAt: string;
  checkedInAt?: string | null;
  gender: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  fullPhoneNumber: string;
  country: string;
  city: string;
  company?: string;
  jobTitle?: string;
  notes?: string | null;
  consent: boolean;
  otpHash?: string | null;
  otpSalt?: string | null;
  otpExpiresAt?: string | null;
  otpLastSentAt?: string | null;
  otpAttemptCount?: number | null;
  otpUsedAt?: string | null;
};

export type ContactEnquiryRecord = {
  id: number;
  documentId: string;
  fullName: string;
  email: string;
  enquiryType: string;
  message: string;
  submittedAt: string;
  source?: string | null;
  notificationStatus: "pending" | "sent" | "failed";
  notifiedAt?: string | null;
  notificationError?: string | null;
};

type StrapiSingleResponse<T> = { data: T | null };
type StrapiCollectionResponse<T> = { data: T[] };
type StrapiPaginatedCollectionResponse<T> = {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};
type StrapiAdminLoginResponse = {
  data?: {
    token?: string;
    accessToken?: string;
    user?: {
      id: number;
      firstname?: string | null;
      lastname?: string | null;
      email: string;
      isActive?: boolean;
      roles?: Array<{
        id: number;
        name: string;
        code: string;
      }>;
    };
  };
};

export type ExpoAccessRole = "admin" | "staff";
export type ExpoAuthResult = {
  id: string;
  email: string;
  name: string;
  expoAccess: ExpoAccessRole;
  authProvider: "strapi-admin";
  strapiRoleName?: string;
  strapiRoleType?: string;
};

export type AttendeeListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type AttendeeListResult = {
  attendees: AttendeeRecord[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  search: string;
};

function normalizeExpoRoleName(roleName: string) {
  return roleName
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

function resolveExpoAccessFromAdminRoles(
  roles: Array<{ name?: string | null; code?: string | null }> = [],
): { expoAccess: ExpoAccessRole; roleName: string; roleCode: string } {
  const normalizedRoles = roles.map((role) => ({
    name: role.name?.trim() ?? "",
    code: role.code?.trim() ?? "",
    normalizedName: normalizeExpoRoleName(role.name ?? ""),
    normalizedCode: normalizeExpoRoleName(role.code ?? ""),
  }));

  const superAdminRole = normalizedRoles.find(
    (role) => role.normalizedCode === "strapi super admin" || role.normalizedName === "super admin",
  );

  if (superAdminRole) {
    return {
      expoAccess: "admin",
      roleName: superAdminRole.name,
      roleCode: superAdminRole.code,
    };
  }

  const firstRole = normalizedRoles[0];

  return {
    expoAccess: "staff",
    roleName: firstRole?.name ?? "",
    roleCode: firstRole?.code ?? "",
  };
}

function getStrapiAdminBaseUrl() {
  const strapiUrl = process.env.STRAPI_URL;

  if (!strapiUrl) {
    throw new Error("STRAPI_URL is not configured.");
  }

  return `${strapiUrl.replace(/\/$/, "")}/api`;
}

function getStrapiBaseUrl() {
  const strapiUrl = process.env.STRAPI_URL;

  if (!strapiUrl) {
    throw new Error("STRAPI_URL is not configured.");
  }

  return strapiUrl.replace(/\/$/, "");
}

function getStrapiAdminHeaders() {
  const token = process.env.STRAPI_API_TOKEN;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function strapiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getStrapiAdminBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...getStrapiAdminHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    // Parse Strapi error shape and surface a readable message instead of raw JSON
    let message: string | undefined;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string; status?: number } };
      message = parsed?.error?.message;
    } catch {
      // not JSON — use raw text below
    }
    const err = new Error(message || text || `Request failed with ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  return JSON.parse(text) as T;
}

async function strapiAdminRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getStrapiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    let message: string | undefined;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; data?: { error?: { message?: string } } };
      message = parsed?.error?.message ?? parsed?.data?.error?.message;
    } catch {
      // not JSON
    }

    const err = new Error(message || text || `Strapi admin request failed with ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  return JSON.parse(text) as T;
}

async function strapiJwtRequest<T>(path: string, jwt: string, init?: RequestInit) {
  return strapiRequest<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function loginExpoUser(identifier: string, password: string): Promise<ExpoAuthResult> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const adminResult = await strapiAdminRequest<StrapiAdminLoginResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedIdentifier,
      password,
    }),
  });

  const accessToken = adminResult.data?.accessToken ?? adminResult.data?.token;
  const adminUser = adminResult.data?.user;

  if (!accessToken || !adminUser?.email) {
    throw new Error("Admin login did not return a valid admin user.");
  }

  const fullName = [adminUser.firstname, adminUser.lastname].filter(Boolean).join(" ").trim();
  const { expoAccess, roleName, roleCode } = resolveExpoAccessFromAdminRoles(adminUser.roles ?? []);

  return {
    id: `admin-${adminUser.id}`,
    email: adminUser.email,
    name: fullName || adminUser.email,
    expoAccess,
    authProvider: "strapi-admin",
    strapiRoleName: roleName,
    strapiRoleType: roleCode,
  };
}

export async function getAttendeeByEmail(email: string) {
  const params = new URLSearchParams({
    "filters[email][$eq]": email,
    "pagination[pageSize]": "1",
  });

  const result = await strapiRequest<StrapiCollectionResponse<AttendeeRecord>>(
    `/attendees?${params.toString()}`,
  );

  return result.data[0] ?? null;
}

export async function getAttendeeByReference(reference: string, jwt?: string) {
  const params = new URLSearchParams({
    "filters[registrationReference][$eq]": reference,
    "pagination[pageSize]": "1",
    sort: "registeredAt:desc",
  });

  const path = `/attendees?${params.toString()}`;
  const result = jwt
    ? await strapiJwtRequest<StrapiCollectionResponse<AttendeeRecord>>(path, jwt)
    : await strapiRequest<StrapiCollectionResponse<AttendeeRecord>>(path);

  return result.data[0] ?? null;
}

export async function getAttendeeByDocumentId(documentId: string, jwt?: string) {
  const path = `/attendees/${documentId}`;
  const result = jwt
    ? await strapiJwtRequest<StrapiSingleResponse<AttendeeRecord>>(path, jwt)
    : await strapiRequest<StrapiSingleResponse<AttendeeRecord>>(path);

  return result.data;
}

export async function listAttendees(
  jwt?: string,
  { page = 1, pageSize = 25, search = "" }: AttendeeListParams = {},
): Promise<AttendeeListResult> {
  const params = new URLSearchParams({
    "pagination[page]": String(Math.max(1, page)),
    "pagination[pageSize]": String(Math.min(100, Math.max(1, pageSize))),
    sort: "registeredAt:desc",
  });

  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    const searchFields = ["firstName", "lastName", "email", "company", "notes"];

    searchFields.forEach((field, index) => {
      params.set(`filters[$or][${index}][${field}][$containsi]`, normalizedSearch);
    });
  }

  const path = `/attendees?${params.toString()}`;
  const result = jwt
    ? await strapiJwtRequest<StrapiPaginatedCollectionResponse<AttendeeRecord>>(path, jwt)
    : await strapiRequest<StrapiPaginatedCollectionResponse<AttendeeRecord>>(path);

  const pagination = result.meta?.pagination ?? {
    page: Math.max(1, page),
    pageSize: Math.min(100, Math.max(1, pageSize)),
    pageCount: 1,
    total: result.data.length,
  };

  return {
    attendees: result.data,
    pagination,
    search: normalizedSearch,
  };
}

export async function createAttendee(data: Record<string, unknown>) {
  const result = await strapiRequest<StrapiSingleResponse<AttendeeRecord>>("/attendees", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  if (!result.data) {
    throw new Error("Failed to create attendee record.");
  }

  return result.data;
}

export async function updateAttendee(documentId: string, data: Record<string, unknown>) {
  const result = await strapiRequest<StrapiSingleResponse<AttendeeRecord>>(`/attendees/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });

  if (!result.data) {
    throw new Error("Failed to retrieve the updated attendee record.");
  }

  return result.data;
}

export async function updateAttendeeWithJwt(
  documentId: string,
  data: Record<string, unknown>,
  jwt: string,
) {
  const result = await strapiJwtRequest<StrapiSingleResponse<AttendeeRecord>>(
    `/attendees/${documentId}`,
    jwt,
    {
      method: "PUT",
      body: JSON.stringify({ data }),
    },
  );

  if (!result.data) {
    throw new Error("Failed to update attendee record.");
  }

  return result.data;
}

export function attendeePayloadFromRegistration(
  registration: PendingRegistration,
  extra: Record<string, unknown> = {},
) {
  const localPhone = normalizeLocalPhone(registration.phone, registration.countryCode);

  return {
    gender: registration.gender,
    firstName: registration.firstName,
    lastName: registration.lastName,
    email: registration.email,
    countryCode: registration.countryCode,
    phone: localPhone,
    fullPhoneNumber: `${registration.countryCode}${localPhone}`,
    country: registration.country,
    city: registration.city,
    company: registration.company || null,
    jobTitle: registration.jobTitle || null,
    notes: null,
    consent: registration.consent,
    ...extra,
  };
}

export async function createContactEnquiry(data: Record<string, unknown>) {
  const result = await strapiRequest<StrapiSingleResponse<ContactEnquiryRecord>>("/contact-enquiries", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  if (!result.data) {
    throw new Error("Failed to create contact enquiry record.");
  }

  return result.data;
}

export async function updateContactEnquiry(documentId: string, data: Record<string, unknown>) {
  const result = await strapiRequest<StrapiSingleResponse<ContactEnquiryRecord>>(
    `/contact-enquiries/${documentId}`,
    {
      method: "PUT",
      body: JSON.stringify({ data }),
    },
  );

  if (!result.data) {
    throw new Error("Failed to update contact enquiry record.");
  }

  return result.data;
}
