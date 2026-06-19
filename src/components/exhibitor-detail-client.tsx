"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
  Building,
  Building2,
  CalendarDays,
  Download,
  LayoutDashboard,
  Map,
  MessageSquare,
  Store,
} from "lucide-react";
import { PageBodyClass } from "@/src/components/page-body-class";
import { ExpoFooter } from "@/src/components/expo-detail-footer";
import type { Exhibitor } from "@/src/lib/expo-types";
import type { ExpoCmsSnapshot } from "@/src/lib/expo-cms";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

type ExhibitorDetailClientProps = {
  brochureHref: string;
  countdownLabel: string;
  exhibitor: Exhibitor;
  expoPage: ExpoCmsSnapshot["expoPage"];
  homepage: HomepageSnapshot;
};

export function ExhibitorDetailClient({
  brochureHref,
  countdownLabel,
  exhibitor,
  expoPage,
  homepage,
}: ExhibitorDetailClientProps) {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function animateIn() {
      const panel = document.getElementById("panel-exhibitor-detail");
      if (!panel) return;

      const { gsap } = await import("gsap");
      if (!mounted) return;

      gsap.fromTo(
        panel,
        { opacity: 0, scale: 1.015, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: "power3.out" },
      );
    }

    void animateIn();

    return () => {
      mounted = false;
    };
  }, []);

  const transitionTo = async (href: string) => {
    const panel = document.getElementById("panel-exhibitor-detail");
    if (!panel) {
      router.push(href);
      return;
    }

    const { gsap } = await import("gsap");
    gsap.to(panel, {
      opacity: 0,
      scale: 0.98,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => router.push(href),
    });
  };

  return (
    <>
      <PageBodyClass className="expo-page" />
      <div className="topbar-shell">
        <div className="wrap topbar">
          <div className="topbar-left">
            <span>{homepage.topbarTagline}</span>
          </div>
          <div className="topbar-right">
            <Link className="topbar-action" href="/contact">
              Contact us
            </Link>
            <Link className="topbar-action primary" href="/members-portal">
              Members portal
            </Link>
          </div>
        </div>
      </div>

      <header className="nav on-dark" id="nav">
        <div className="wrap row">
          <Link className="logo-link" href="/2026-aiae-expo">
            <img className="logo-mark logo-mark-default" src="/assets/logo-wordmark-light.svg" alt="Agri Africa" />
            <img className="logo-mark logo-mark-scroll" src="/assets/logo-wordmark-dark.svg" alt="" aria-hidden="true" />
            <img className="logo-mark logo-mark-icon" src="/assets/logo-icon.svg" alt="" aria-hidden="true" />
          </Link>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/2026-aiae-expo#overview">Overview</Link>
            <Link href="/2026-aiae-expo#exhibitors">Exhibitors</Link>
            <Link href="/2026-aiae-expo#support">Support Units</Link>
            <Link href="/2026-aiae-expo#floorplan">Floor Plan</Link>
            <Link href="/2026-aiae-expo#programme">Programme</Link>
          </nav>
          <div className="nav-right">
            <Link className="btn btn-accent sm" href="/visitor-registration">
              Register Now
            </Link>
          </div>
        </div>
      </header>

      <section className="expo-hero" id="expo-top">
        <div className="hero-pat hero-pat-grid" data-depth="0.4" aria-hidden="true" />
        <div className="hero-pat hero-pat-dots" data-depth="0.9" aria-hidden="true" />
        <div className="hero-pat hero-pat-shapes" data-depth="1.7" aria-hidden="true">
          <svg className="pat-svg" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="pat-shape" cx="120" cy="280" r="110" stroke="rgba(95,168,60,.09)" strokeWidth="1" />
            <circle className="pat-shape" cx="1360" cy="80" r="140" stroke="rgba(95,168,60,.07)" strokeWidth="1" />
            <circle className="pat-shape" cx="720" cy="420" r="180" stroke="rgba(246,210,121,.05)" strokeWidth="1" />
            <circle className="pat-shape" cx="1100" cy="320" r="60" stroke="rgba(95,168,60,.11)" strokeWidth="1" />
            <rect className="pat-shape" x="76" y="56" width="22" height="22" fill="rgba(246,210,121,.14)" transform="rotate(45 87 67)" />
            <rect className="pat-shape" x="340" y="200" width="14" height="14" fill="rgba(95,168,60,.18)" transform="rotate(45 347 207)" />
            <rect className="pat-shape" x="860" y="40" width="18" height="18" fill="rgba(246,210,121,.11)" transform="rotate(45 869 49)" />
            <rect className="pat-shape" x="1220" y="130" width="26" height="26" fill="rgba(95,168,60,.13)" transform="rotate(45 1233 143)" />
            <rect className="pat-shape" x="580" y="300" width="16" height="16" fill="rgba(246,210,121,.09)" transform="rotate(45 588 308)" />
            <rect className="pat-shape" x="1050" y="240" width="12" height="12" fill="rgba(95,168,60,.15)" transform="rotate(45 1056 246)" />
            <path className="pat-shape" d="M200 130 h10 M205 125 v10" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" strokeLinecap="round" />
            <path className="pat-shape" d="M990 280 h10 M995 275 v10" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" strokeLinecap="round" />
            <path className="pat-shape" d="M480 80 h10 M485 75 v10" stroke="rgba(246,210,121,.14)" strokeWidth="1.5" strokeLinecap="round" />
            <path className="pat-shape" d="M1310 220 h10 M1315 215 v10" stroke="rgba(255,255,255,.08)" strokeWidth="1.5" strokeLinecap="round" />
            <line className="pat-shape" x1="420" y1="0" x2="520" y2="360" stroke="rgba(95,168,60,.07)" strokeWidth="1" />
            <line className="pat-shape" x1="840" y1="0" x2="940" y2="360" stroke="rgba(255,255,255,.04)" strokeWidth="1" />
            <line className="pat-shape" x1="1140" y1="0" x2="1240" y2="360" stroke="rgba(95,168,60,.05)" strokeWidth="1" />
            <path className="pat-shape" d="M650 120 l8-8 l8 8 l-8 8 Z" fill="rgba(95,168,60,.12)" />
            <path className="pat-shape" d="M1180 60 l6-6 l6 6 l-6 6 Z" fill="rgba(95,168,60,.09)" />
            <path className="pat-shape" d="M260 310 l10-10 l10 10 l-10 10 Z" fill="rgba(246,210,121,.1)" />
          </svg>
        </div>
        <div className="hero-grain" aria-hidden="true" />
        <div className="wrap hero-inner">
          <h1 className="hero-title">2026 - Africa International<br />Agricultural Expo</h1>
          <div className="hero-strip">
            <span>{expoPage.dates.replace("October", "Oct")}</span>
            <span className="sep">·</span>
            <span>{expoPage.venue.replace(", Kenya", "")}</span>
            <span className="sep">·</span>
            <span id="days-hero">{countdownLabel}</span>
          </div>
        </div>
      </section>

      <div className="wrap expo-wrap">
        <div className="expo-body">
          <aside className="expo-sidebar">
            <nav className="tab-nav" aria-label="Expo sections">
              <div className="tab-section-label">Information</div>
              <Link className="tab-item" href="/2026-aiae-expo#overview">
                <span className="tab-icon" aria-hidden="true"><LayoutDashboard /></span>
                <span className="tab-label">Overview</span>
              </Link>
              <Link className="tab-item" href="/2026-aiae-expo#exhibitors">
                <span className="tab-icon" aria-hidden="true"><Store /></span>
                <span className="tab-label">Exhibitors</span>
              </Link>
              <div className="tab-item exhibitor-detail-tab active" aria-current="page">
                <span className="tab-icon" aria-hidden="true"><Building /></span>
                <span className="tab-label">{exhibitor.name}</span>
              </div>
              <Link className="tab-item" href="/2026-aiae-expo#support">
                <span className="tab-icon" aria-hidden="true"><Building2 /></span>
                <span className="tab-label">Support Units</span>
              </Link>
              <Link className="tab-item" href="/2026-aiae-expo#floorplan">
                <span className="tab-icon" aria-hidden="true"><Map /></span>
                <span className="tab-label">Floor Plan</span>
              </Link>
              <Link className="tab-item" href="/2026-aiae-expo#programme">
                <span className="tab-icon" aria-hidden="true"><CalendarDays /></span>
                <span className="tab-label">Programme</span>
              </Link>
            </nav>
            <div className="sidebar-footer">
              <div className="sidebar-meta">
                <span className="sidebar-event-title">{homepage.eventFullTitle}</span>
                <strong>{expoPage.dates}</strong>
                {expoPage.venue}
              </div>
              <Link className="btn btn-accent block" href="/visitor-registration">
                Register Now →
              </Link>
            </div>
          </aside>

          <div className="expo-panels">
            <div className="panel active" id="panel-exhibitor-detail" style={{ display: "block" }}>
              <div className="exhibitor-detail-head">
                <div className="detail-booth-card">
                  <span>Booth</span>
                  <strong>{exhibitor.booth.replace(/^Booth\s*/i, "")}</strong>
                </div>
                <div className="company-identity">
                  <div className="company-logo" aria-hidden="true">{exhibitor.logo}</div>
                  <h1>{exhibitor.name}</h1>
                  <div className="company-meta">
                    <div><span>Country</span><strong>{exhibitor.country}</strong></div>
                    <div><span>Line of business</span><strong>{exhibitor.business}</strong></div>
                  </div>
                </div>
              </div>

              <p className="company-intro">{exhibitor.intro}</p>

              <div className="company-offerings" id="detail-offerings">
                <section className="offering-column">
                  <div className="eyebrow">Products</div>
                  <ul>
                    {exhibitor.products.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
                <section className="offering-column">
                  <div className="eyebrow">Services</div>
                  <ul>
                    {exhibitor.services.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              </div>

              <aside className="company-contact">
                <div className="eyebrow">Contact Information</div>
                <div className="contact-details">
                  <div><span>Contact person</span><strong>{exhibitor.contact}</strong></div>
                  <div><span>Tel No.</span><strong>{exhibitor.phone}</strong></div>
                  <div><span>Email</span><strong>{exhibitor.email}</strong></div>
                </div>
              </aside>

              <div className="company-actions">
                <button className="btn btn-ghost" type="button" onClick={() => void transitionTo("/2026-aiae-expo#exhibitors")}>
                  <ArrowLeft /> Go Back
                </button>
                <a className="btn btn-secondary" href={brochureHref} download={`${exhibitor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brochure.txt`}>
                  <Download /> Download Brochure
                </a>
                <Link className="btn btn-accent" href={`/members-portal?company=${encodeURIComponent(exhibitor.name)}`}>
                  <MessageSquare /> Interact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExpoFooter homepage={homepage} />
    </>
  );
}
