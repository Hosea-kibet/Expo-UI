import { NextRequest } from "next/server";
import {
  getStrapiCacheTags,
  getStrapiRevalidateSeconds,
} from "@/src/lib/cache";

export async function proxyStrapiRequest(
  request: NextRequest,
  path: string[],
) {
  const strapiUrl = process.env.STRAPI_URL;
  const token = process.env.STRAPI_API_TOKEN;

  if (!strapiUrl) {
    return new Response(
      JSON.stringify({ error: "STRAPI_URL is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const joinedPath = path.join("/");
  const upstreamUrl = new URL(`/api/${joinedPath}`, strapiUrl);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const joinedEndpoint = joinedPath.replace(/^\/+/, "");
  const isCacheableMethod = ["GET", "HEAD"].includes(request.method);
  const init: RequestInit & {
    next?: {
      revalidate: number;
      tags: string[];
    };
  } = {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: isCacheableMethod ? "force-cache" : "no-store",
  };

  if (isCacheableMethod) {
    init.next = {
      revalidate: getStrapiRevalidateSeconds(joinedEndpoint),
      tags: getStrapiCacheTags(joinedEndpoint),
    };
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  const response = await fetch(upstreamUrl, init);
  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      ...(isCacheableMethod
        ? {
            "Cache-Control": `public, s-maxage=${getStrapiRevalidateSeconds(joinedEndpoint)}, stale-while-revalidate=${getStrapiRevalidateSeconds(joinedEndpoint)}`,
          }
        : { "Cache-Control": "no-store" }),
    },
  });
}
