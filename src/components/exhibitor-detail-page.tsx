import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExhibitorDetailClient } from "@/src/components/exhibitor-detail-client";
import { exhibitors } from "@/src/data/expo";
import { getExpoExhibitorBySlug } from "@/src/lib/expo-cms";

type Params = { slug: string };

export function generateExhibitorStaticParams() {
  return exhibitors.map((item) => ({ slug: item.slug }));
}

export async function generateExhibitorMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exhibitor = await getExpoExhibitorBySlug(slug);
  if (!exhibitor) return { title: "Exhibitor - Agri Africa" };
  return { title: `${exhibitor.name} - 2026 AIAE Expo` };
}

export async function ExhibitorDetailPageContent({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const exhibitor = await getExpoExhibitorBySlug(slug);
  if (!exhibitor) notFound();

  const daysToGo = Math.ceil((new Date("2026-10-27T00:00:00").getTime() - Date.now()) / 86400000);
  const countdownLabel = daysToGo > 0 ? `${daysToGo} days to go` : daysToGo === 0 ? "Today" : "See you in 2027";
  const brochureHref = `data:text/plain;charset=utf-8,${encodeURIComponent(
    `${exhibitor.name}\n${exhibitor.booth}\n\n${exhibitor.intro}\n\nContact: ${exhibitor.contact}\n${exhibitor.phone}\n${exhibitor.email}`,
  )}`;

  return (
    <ExhibitorDetailClient
      brochureHref={brochureHref}
      countdownLabel={countdownLabel}
      exhibitor={exhibitor}
    />
  );
}
