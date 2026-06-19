type QueryValue = string | number | boolean;

type QueryParams = Record<string, QueryValue | QueryValue[] | undefined>;

function buildQuery(params?: QueryParams) {
  if (!params) return "";

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
      return;
    }

    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function getStrapiApiBaseUrl() {
  if (typeof window === "undefined" && process.env.STRAPI_URL) {
    return `${process.env.STRAPI_URL.replace(/\/$/, "")}/api`;
  }

  return process.env.NEXT_PUBLIC_STRAPI_API_URL ?? "/api/strapi";
}

export async function fetchStrapi<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const baseUrl = getStrapiApiBaseUrl().replace(/\/$/, "");
  const normalizedEndpoint = endpoint.replace(/^\//, "");

  const response = await fetch(`${baseUrl}/${normalizedEndpoint}${buildQuery(params)}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Strapi request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getStrapiCollection<T>(
  endpoint: string,
  params?: QueryParams,
) {
  return fetchStrapi<T>(endpoint, params);
}

export async function getStrapiSingle<T>(
  endpoint: string,
  params?: QueryParams,
) {
  return fetchStrapi<T>(endpoint, params);
}
