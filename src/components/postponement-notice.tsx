import { ArrowUpRight, CalendarClock, Download } from "lucide-react";
import { EXPO_STATUS } from "@/src/lib/event-status";

export function PostponementNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <aside className="postponement-inline" aria-label="Expo postponement notice">
        <CalendarClock aria-hidden="true" />
        <div>
          <strong>{EXPO_STATUS.title}</strong>
          <p>{EXPO_STATUS.compactSummary}</p>
          <a href={EXPO_STATUS.poster} target="_blank" rel="noopener noreferrer">
            View official notice <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </aside>
    );
  }

  return (
    <section
      className="postponement-section"
      id="postponement-notice"
      aria-labelledby="postponement-title"
    >
      <div className="wrap postponement-layout">
        <div className="postponement-copy">
          <span className="postponement-kicker">
            <CalendarClock aria-hidden="true" /> Official announcement
          </span>
          <h2 id="postponement-title">
            AIAE 2026<br /><span>{EXPO_STATUS.label}</span>
          </h2>
          <p>
            In light of prevailing circumstances beyond our control, the Africa
            International Agricultural Expo (AIAE) 2026, originally scheduled for
            23–25 October 2026 at KICC, Nairobi, has been postponed.
          </p>
          <div className="postponement-date">
            <strong>Tentatively early 2027</strong>
            <span>{EXPO_STATUS.dateUpdate}</span>
          </div>
          <p>We sincerely appreciate your understanding and continued support.</p>
          <a
            className="postponement-download"
            href={EXPO_STATUS.poster}
            download="AIAE-2026-Postponement-Notice.jpeg"
          >
            <Download aria-hidden="true" /> Download official notice
          </a>
          <small>Issued 14 October 2026 · The AIAE Team</small>
        </div>
        <a
          className="postponement-poster"
          href={EXPO_STATUS.poster}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the official AIAE postponement poster at full size (opens in a new tab)"
        >
          <img
            src={EXPO_STATUS.poster}
            width={1080}
            height={1350}
            alt={`Official AIAE announcement issued 14 October 2026: AIAE 2026 is postponed to 2027, tentatively early 2027. ${EXPO_STATUS.dateUpdate}`}
          />
          <span>View full-size notice <ArrowUpRight aria-hidden="true" /></span>
        </a>
      </div>
    </section>
  );
}
