function getStrapiOrigin() {
  return (
    process.env.NEXT_PUBLIC_STRAPI_MEDIA_URL?.replace(/\/$/, "") ??
    process.env.STRAPI_URL?.replace(/\/$/, "") ??
    ""
  );
}

export function normalizeStrapiAssetUrl(value?: string | null) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;

  const strapiOrigin = getStrapiOrigin();
  if (!strapiOrigin) {
    return value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
  }

  if (value.startsWith("/")) {
    return `${strapiOrigin}${value}`;
  }

  return `${strapiOrigin}/${value.replace(/^\/+/, "")}`;
}
