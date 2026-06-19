import { NextRequest } from "next/server";

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

  const init: RequestInit = {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  const response = await fetch(upstreamUrl, init);
  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
