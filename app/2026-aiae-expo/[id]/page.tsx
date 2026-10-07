import {
  ExhibitorDetailPageContent,
  generateExhibitorMetadata,
} from "@/src/components/exhibitor-detail-page";

export const dynamic = "force-dynamic";
export const generateMetadata = generateExhibitorMetadata;

export default function ExhibitorDetailAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ExhibitorDetailPageContent params={params} />;
}
