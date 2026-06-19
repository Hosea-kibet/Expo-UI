import {
  ExhibitorDetailPageContent,
  generateExhibitorMetadata,
  generateExhibitorStaticParams,
} from "@/src/components/exhibitor-detail-page";

export const generateStaticParams = generateExhibitorStaticParams;
export const generateMetadata = generateExhibitorMetadata;

export default function ExhibitorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ExhibitorDetailPageContent params={params} />;
}
