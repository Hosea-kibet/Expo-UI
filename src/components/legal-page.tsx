import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ExpoFooter } from "@/src/components/expo-detail-footer";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

export function LegalPage({
  title,
  content,
  homepage,
}: {
  title: string;
  content: string;
  homepage: HomepageSnapshot;
}) {
  return (
    <>
      <header className="legal-page-header">
        <div className="wrap">
          <Link className="legal-page-back" href="/">
            <ArrowLeft /> Back to home
          </Link>
          <div className="legal-page-intro">
            <div className="eyebrow">Agri Africa Legal</div>
            <h1>{title}</h1>
            <p>Policy information for Agri Africa visitors, exhibitors, partners, and platform users.</p>
          </div>
          <div className="legal-page-orbit" aria-hidden="true">
            <span />
            <span />
          </div>
        </div>
      </header>

      <main className="legal-page-main">
        <div className="wrap">
          <article className="legal-page-article">
            <div className="legal-page-strip" aria-hidden="true" />
            <div className="legal-page-content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      </main>

      <ExpoFooter homepage={homepage} />
    </>
  );
}
