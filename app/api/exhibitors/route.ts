import { NextRequest } from "next/server";
import { getFilteredExhibitors } from "@/src/lib/expo-cms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryParam = searchParams.get("country");
    const country =
      countryParam === "china" ||
      countryParam === "kenya" ||
      countryParam === "africa" ||
      countryParam === "all"
        ? countryParam
        : "all";

    const exhibitors = await getFilteredExhibitors({
      query: searchParams.get("q") ?? undefined,
      booth: searchParams.get("booth") ?? undefined,
      country,
    });

    return Response.json({
      ok: true,
      exhibitors,
      total: exhibitors.length,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load exhibitors.",
      },
      { status: 500 },
    );
  }
}
