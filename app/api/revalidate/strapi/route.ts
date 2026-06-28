import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { CACHE_TAGS, getAllCacheTags, getTagsForStrapiModels } from "@/src/lib/cache";

type StrapiWebhookBody = {
  event?: string;
  model?: string;
  uid?: string;
};

function getConfiguredSecret() {
  return process.env.STRAPI_REVALIDATE_SECRET ?? process.env.REVALIDATE_SECRET ?? "";
}

function extractProvidedSecret(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return (
    request.headers.get("x-revalidate-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    ""
  ).trim();
}

function isAuthorized(request: NextRequest) {
  const configuredSecret = getConfiguredSecret();
  if (!configuredSecret) {
    return false;
  }

  return extractProvidedSecret(request) === configuredSecret;
}

function resolveTagsToRevalidate(payload: StrapiWebhookBody) {
  const modelCandidates = [payload.model, payload.uid].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  const matchedTags = getTagsForStrapiModels(modelCandidates);

  if (matchedTags.length > 0) {
    return [CACHE_TAGS.strapi, ...matchedTags];
  }

  return getAllCacheTags();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized revalidation request." },
      { status: 401 },
    );
  }

  let payload: StrapiWebhookBody = {};

  try {
    payload = (await request.json()) as StrapiWebhookBody;
  } catch {
    payload = {};
  }

  const tags = resolveTagsToRevalidate(payload);

  tags.forEach((tag) => revalidateTag(tag));

  return NextResponse.json({
    ok: true,
    event: payload.event ?? null,
    model: payload.model ?? null,
    uid: payload.uid ?? null,
    revalidatedTags: tags,
  });
}
