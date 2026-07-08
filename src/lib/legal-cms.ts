import {
  getPrivacyPolicyContent,
  getTermsAndConditionContent,
} from "@/src/lib/strapi-content";

export type LegalDocumentSnapshot = {
  title: string;
  content: string;
};

async function normalizeLegalDocument(
  loader: () => Promise<{ data: { title?: unknown; content?: unknown } | null }>,
  key: string,
): Promise<LegalDocumentSnapshot> {
  const response = await loader();
  const data =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : null;

  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const content = typeof data?.content === "string" ? data.content.trim() : "";

  if (!title) {
    throw new Error(`Legal content is incomplete in Strapi. Missing field: ${key}.title`);
  }

  if (!content) {
    throw new Error(`Legal content is incomplete in Strapi. Missing field: ${key}.content`);
  }

  return { title, content };
}

export async function getPrivacyPolicySnapshot() {
  return normalizeLegalDocument(getPrivacyPolicyContent, "privacy-policy");
}

export async function getTermsAndConditionsSnapshot() {
  return normalizeLegalDocument(getTermsAndConditionContent, "terms-and-condition");
}
