import HomepageClient from "@/src/components/homepage-client";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export default async function Page() {
  const homepage = await getHomepageSnapshot();
  return <HomepageClient initialData={homepage} />;
}
