"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Building2,
  CalendarDays,
  Download,
  Facebook,
  Globe2,
  Instagram,
  Layers3,
  LayoutDashboard,
  Linkedin,
  Mail,
  Map,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  Search,
  Store,
  Youtube,
} from "lucide-react";
import { BrandPreloader } from "@/src/components/brand-preloader";
import { ExpoOverview } from "@/src/components/expo-overview";
import { PageBodyClass } from "@/src/components/page-body-class";
import type { ExpoCmsSnapshot } from "@/src/lib/expo-cms";
import type { Exhibitor, SupportUnit } from "@/src/lib/expo-types";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

type ExpoTab = "overview" | "exhibitors" | "support" | "floorplan" | "programme";
type ExpoViewTab = ExpoTab | "exhibitor-detail";

const tabLabels: Record<ExpoTab, string> = {
  overview: "Overview",
  exhibitors: "Exhibitors",
  support: "Support Units",
  floorplan: "Floor Plan",
  programme: "Programme",
};

function scrollToExpoTab(tab: ExpoTab) {
  const target = document.getElementById(tab);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const body = document.querySelector(".expo-body");
  if (!body) return;

  const bodyTop = window.scrollY + body.getBoundingClientRect().top;
  const offset = window.innerWidth > 860 ? 58 : 82;
  window.scrollTo({ top: Math.max(0, bodyTop - offset), behavior: "smooth" });
}

function ExhibitorDetailPanel({
  active,
  exhibitor,
  onBack,
}: {
  active: boolean;
  exhibitor: Exhibitor | null;
  onBack: () => void;
}) {
  if (!exhibitor) return null;

  const brochureHref = `data:text/plain;charset=utf-8,${encodeURIComponent(
    `${exhibitor.name}\n${exhibitor.booth}\n\n${exhibitor.intro}\n\nContact: ${exhibitor.contact}\n${exhibitor.phone}\n${exhibitor.email}`,
  )}`;

  return (
    <div className={`panel${active ? " active" : ""}`} id="panel-exhibitor-detail" style={{ display: active ? "block" : "none" }}>
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
        <section className="offering-column" hidden={exhibitor.products.length === 0}>
          <div className="eyebrow">Products</div>
          <ul>
            {exhibitor.products.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="offering-column" hidden={exhibitor.services.length === 0}>
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
        <button className="btn btn-ghost" id="exhibitor-back" type="button" onClick={onBack}>
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
  );
}

function ExpoFooter({
  homepage,
  onPartnerClick,
}: {
  homepage: HomepageSnapshot;
  onPartnerClick: (partner: {
    badge: string;
    title: string;
    about: string;
    involvement: string;
    url: string;
  }) => void;
}) {
  return (
    <>
      <div className="news">
        <div className="wrap grid event-register-cta">
          <div className="reveal-up in">
            <div className="eyebrow" style={{ color: "var(--harvest-100)" }}>
              {homepage.registrationEyebrow}
            </div>
            <h3>{homepage.registrationTitle}</h3>
            <div className="event-register-details">
              <span>
                <CalendarDays /> {homepage.registrationDates}
              </span>
              <span>
                <MapPin /> {homepage.registrationVenue}
              </span>
            </div>
          </div>
          <div className="event-register-action reveal-up in" style={{ transitionDelay: ".14s" }}>
            <p>{homepage.registrationBody}</p>
            <Link className="btn btn-light lg" href="/visitor-registration">
              Register Now <ArrowRight />
            </Link>
          </div>
        </div>
      </div>

      <footer className="site" id="contact">
        <div className="wrap inner">
          <div className="foot-grid">
            <div className="foot-brand reveal-up in">
              <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
              <p>{homepage.footerBrandCopy}</p>
              <div className="socials">
                {homepage.socialLinks.map((social) => {
                  const Icon =
                    social.platform === "facebook"
                      ? Facebook
                      : social.platform === "instagram"
                        ? Instagram
                        : social.platform === "youtube"
                          ? Youtube
                          : Linkedin;

                  return (
                    <a key={social.platform} href={social.url} aria-label={social.platform}>
                      <Icon style={{ width: 16, height: 16 }} />
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="foot-col reveal-up in" style={{ transitionDelay: ".1s" }}>
              <div className="h">Expo</div>
              <Link href="/2026-aiae-expo">2026 Expo page</Link>
              <Link href="/visitor-registration">Register Now</Link>
              <Link href="/gallery">Gallery</Link>
            </div>
            <div className="foot-col reveal-up in" style={{ transitionDelay: ".2s" }}>
              <div className="h">Partners</div>
              {homepage.partners.map((partner) => (
                <a
                  key={partner.name}
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    onPartnerClick(partner);
                  }}
                >
                  {partner.name}
                </a>
              ))}
            </div>
          </div>
          <div className="contact reveal-up in" style={{ transitionDelay: ".12s" }}>
            <div className="item">
              <Phone style={{ width: 16, height: 16 }} /> {homepage.phone}
            </div>
            <div className="item">
              <Mail style={{ width: 16, height: 16 }} /> {homepage.email}
            </div>
            <div className="item">
              <MapPin style={{ width: 16, height: 16 }} /> {homepage.address}
            </div>
          </div>
          <div className="legal reveal-up in" style={{ transitionDelay: ".22s" }}>
            <span>{homepage.legalLeft}</span>
            <span>{homepage.legalRight}</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function ExhibitorsPanel({
  active,
  onOpenExhibitor,
  exhibitorsData,
}: {
  active: boolean;
  onOpenExhibitor: (slug: string) => void;
  exhibitorsData: Exhibitor[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Exhibitor["category"]>("all");
  const [country, setCountry] = useState<"all" | Exhibitor["countryFilter"]>("all");

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return exhibitorsData.filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      const countryMatch = country === "all" || item.countryFilter === country;
      const textMatch =
        !lowered ||
        `${item.name} ${item.business} ${item.cardDescription}`.toLowerCase().includes(lowered);
      return categoryMatch && countryMatch && textMatch;
    });
  }, [query, category, country, exhibitorsData]);

  return (
    <div className={`panel${active ? " active" : ""}`} id="panel-exhibitors" style={{ display: active ? "block" : "none" }}>
      <div id="exhibitors" className="panel-anchor" aria-hidden="true" />
      <div className="panel-head reveal in">
        <div className="eyebrow">Exhibitors · 2026</div>
        <h1>Who&apos;s Exhibiting</h1>
        <p>Companies and organisations shaping Africa&apos;s agricultural value chains.</p>
      </div>
      <div className="reveal in">
        <div className="exhibitor-tools">
          <label className="exhibitor-filter exhibitor-search">
            <span>Search</span>
            <div className="exhibitor-control">
              <Search aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Company or sector" autoComplete="off" />
            </div>
          </label>
          <label className="exhibitor-filter">
            <span>Category</span>
            <div className="exhibitor-control">
              <Layers3 aria-hidden="true" />
              <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
                <option value="all">All categories</option>
                <option value="machinery">Machinery</option>
                <option value="technology">Technology</option>
                <option value="produce">Produce</option>
                <option value="health">Animal Health</option>
              </select>
            </div>
          </label>
          <label className="exhibitor-filter">
            <span>Country</span>
            <div className="exhibitor-control">
              <Globe2 aria-hidden="true" />
              <select value={country} onChange={(e) => setCountry(e.target.value as typeof country)}>
                <option value="all">All countries</option>
                <option value="china">China</option>
                <option value="kenya">Kenya</option>
                <option value="africa">Africa</option>
              </select>
            </div>
          </label>
          <button
            className="exhibitor-reset"
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setCountry("all");
            }}
          >
            <RotateCcw aria-hidden="true" /> Reset
          </button>
        </div>

        <div className="exhibitor-results" aria-live="polite">
          {filtered.length} exhibitor{filtered.length === 1 ? "" : "s"}
        </div>

        <div className="exhibitor-grid">
          {filtered.map((item) => (
            <a
              className="ex-card"
              key={item.slug}
              href={`/2026-aiae-expo/${item.slug}`}
              onClick={(event) => {
                event.preventDefault();
                onOpenExhibitor(item.slug);
              }}
            >
              <span className="booth-badge">{item.booth}</span>
              <div className="ex-name">{item.name}</div>
              <div className="ex-origin">{item.origin}</div>
              <div className="ex-desc">{item.cardDescription}</div>
              <span className="ex-link">View Details →</span>
            </a>
          ))}
        </div>

        {filtered.length === 0 ? <p className="exhibitor-empty">No exhibitors match your search.</p> : null}

        <div className="section-sep" />
        <div className="cta-row">
          <a className="btn btn-accent" href="#">
            Book a Stand
          </a>
          <a className="btn btn-ghost" href="#">
            Download Exhibitor Pack
          </a>
        </div>
      </div>
    </div>
  );
}

function SupportUnitsPanel({
  active,
  onOpenUnit,
  units,
}: {
  active: boolean;
  onOpenUnit: (unit: SupportUnit) => void;
  units: SupportUnit[];
}) {
  const groups = ["Government", "Industry", "Media"] as const;

  return (
    <div className={`panel${active ? " active" : ""}`} id="panel-support" style={{ display: active ? "block" : "none" }}>
      <div id="support" className="panel-anchor" aria-hidden="true" />
      <div className="panel-head reveal in">
        <div className="eyebrow">Support Units</div>
        <h1>Institutional Backing</h1>
        <p>Government bodies, industry associations, and media partners driving agricultural transformation.</p>
      </div>
      <div className="support-grid reveal in">
        {groups.map((group) => (
          <div className="support-col" key={group}>
            <h3>{group}</h3>
            <div className="support-list">
              {units
                .filter((unit) => unit.group === group)
                .map((unit) => (
                  <button className="support-item" key={unit.slug} type="button" onClick={() => onOpenUnit(unit)}>
                    <span className={`support-logo ${group.toLowerCase()}`}>
                      <img src={unit.logoSrc} alt={unit.alt} />
                    </span>
                    <span className="support-name">{unit.title}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="section-sep" />
      <div className="cta-row reveal in">
        <a className="btn btn-accent" href="#">
          Become a Support Unit
        </a>
        <a className="btn btn-ghost" href="#">
          Media Accreditation
        </a>
      </div>
    </div>
  );
}

function FloorPlanPanel({
  active,
  floorPlanUrl,
  venue,
}: {
  active: boolean;
  floorPlanUrl: string;
  venue: string;
}) {
  return (
    <div className={`panel${active ? " active" : ""}`} id="panel-floorplan" style={{ display: active ? "block" : "none" }}>
      <div id="floorplan" className="panel-anchor" aria-hidden="true" />
      <div className="panel-head reveal in">
        <div className="eyebrow">Plan Your Visit</div>
        <h1>Explore the Exhibition Hall</h1>
        <p>Navigate the thematic exhibition zones, conference stage, networking lounges, and visitor facilities before you arrive.</p>
      </div>
      <div className="floor-meta reveal in">
        <div className="floor-meta-item"><span className="k">Venue</span><span className="v">{venue.replace(", Kenya", "")}</span></div>
        <div className="floor-meta-item"><span className="k">Total Area</span><span className="v">6,000 m²</span></div>
        <div className="floor-meta-item"><span className="k">Booth Sizes</span><span className="v">9m² – 36m²</span></div>
        <div className="floor-meta-item"><span className="k">Zones</span><span className="v">5 Thematic</span></div>
      </div>
      <figure className="floor-plan-image reveal in">
        <img src={floorPlanUrl} alt="Top-down visual of the 2026 - AIAE exhibition hall layout" />
        <figcaption>
          <span>Illustrative hall layout</span>
          Final booth allocations will be shared with registered exhibitors and visitors.
        </figcaption>
      </figure>
      <div className="cta-row reveal in">
        <a className="btn btn-accent" href="#">
          Request a Booth
        </a>
        <a className="btn btn-ghost" href={floorPlanUrl} download>
          <Download /> Download Floor Plan
        </a>
      </div>
    </div>
  );
}

function ProgrammePanel({
  active,
  programmeDaysData,
}: {
  active: boolean;
  programmeDaysData: Array<{
    id: string;
    label: string;
    heading: string;
    hours: string;
    sessions: Array<[string, string, string, string]>;
  }>;
}) {
  const [day, setDay] = useState(programmeDaysData[0]?.id ?? "tue");

  return (
    <div className={`panel${active ? " active" : ""}`} id="panel-programme" style={{ display: active ? "block" : "none" }}>
      <div id="programme" className="panel-anchor" aria-hidden="true" />
      <div className="panel-head reveal in">
        <div className="eyebrow">Event Schedule</div>
        <h1>4 Days, Curated</h1>
        <p>Keynotes, workshops, B2B networking, and cultural moments — built for decision-makers.</p>
      </div>
      <div className="reveal in">
        <div className="day-tabs" id="day-tabs">
          {programmeDaysData.map((item) => (
            <button
              key={item.id}
              className={`day-tab${day === item.id ? " active" : ""}`}
              data-day={item.id}
              onClick={() => setDay(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {programmeDaysData.map((item) => (
          <div className={`day-content${day === item.id ? " active" : ""}`} id={`day-${item.id}`} key={item.id}>
            <div className="programme-day-heading">
              <h2>{item.heading}</h2>
              <span>{item.hours}</span>
            </div>
            <div className="session-list">
              {item.sessions.map(([time, title, description, tag]) => (
                <div className="session" key={`${item.id}-${time}-${title}`}>
                  <div className="session-time">{time}</div>
                  <div>
                    <div className="session-title">{title}</div>
                    <div className="session-desc">{description}</div>
                    <span className="session-tag">{tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpoClient({
  initialData,
  homepageData,
}: {
  initialData: ExpoCmsSnapshot;
  homepageData: HomepageSnapshot;
}) {
  const exhibitorsData = initialData.exhibitors;
  const supportUnitsData = initialData.supportUnits;
  const programmeDaysData = initialData.programmeDays;
  const expoPage = initialData.expoPage;
  const [activeTab, setActiveTab] = useState<ExpoViewTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [partnerModal, setPartnerModal] = useState<null | {
    badge: string;
    title: string;
    about: string;
    involvement: string;
    url: string;
  }>(null);
  const [supportUnitModal, setSupportUnitModal] = useState<SupportUnit | null>(null);

  useEffect(() => {
    const previous = document.body.className;
    document.body.className = "loading expo-page";
    let mounted = true;
    const cleanup: Array<() => void> = [];

    async function init() {
      const { gsap } = await import("gsap");
      if (!mounted) return;
      (window as Window & { gsap?: typeof gsap }).gsap = gsap;

      const preEl = document.getElementById("preloader");
      if (preEl) {
        const tl = gsap.timeline({
          onComplete: () => {
            document.body.classList.remove("loading");
          },
        });
        gsap.set(".pre-mark", { scale: 22, transformOrigin: "center center" });
        gsap.set(".pre-wm", { opacity: 0 });
        gsap.set(".pre-lt", { opacity: 0 });
        tl.to(".pre-mark", { scale: 1, duration: 1.2, ease: "expo.out" })
          .to(".pre-mark", { x: -82, y: -15, scale: 0.73, duration: 0.42, delay: 0.1, ease: "power2.inOut" })
          .to(".pre-mark", { opacity: 0, duration: 0.18, ease: "power2.in" })
          .to(".pre-wm", { opacity: 1, duration: 0.22, ease: "power2.out" }, "<0.04")
          .to(".pre-lt", { opacity: 1, duration: 0.1, stagger: 0.065, ease: "power1.out" })
          .to(preEl, {
            opacity: 0,
            duration: 0.7,
            delay: 0.55,
            ease: "power2.inOut",
            onComplete: () => preEl.classList.add("done"),
          });
      } else {
        document.body.classList.remove("loading");
      }

      const nav = document.getElementById("nav");
      const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 24);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanup.push(() => window.removeEventListener("scroll", onScroll));

      if (nav) {
        const onDocument = (event: MouseEvent) => {
          if (event.target instanceof Node && !nav.contains(event.target)) {
            setMobileMenuOpen(false);
          }
        };
        document.addEventListener("click", onDocument);
        cleanup.push(() => document.removeEventListener("click", onDocument));
      }

      const target = new Date("2026-10-27T00:00:00");
      const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
      const daysEl = document.getElementById("days-hero");
      if (daysEl) {
        if (diff > 0) daysEl.textContent = `${diff} days to go`;
        else if (diff === 0) daysEl.textContent = "Today";
        else daysEl.textContent = "See you in 2027";
      }

      const hero = document.querySelector<HTMLElement>(".expo-hero");
      const layers = Array.from(document.querySelectorAll<HTMLElement>(".hero-pat"));
      if (hero && layers.length > 0) {
        const movers = layers.map((el) => {
          const depth = Number.parseFloat(el.dataset.depth ?? "1");
          return {
            x: gsap.quickTo(el, "x", { duration: 0.9 + depth * 0.35, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.9 + depth * 0.35, ease: "power3.out" }),
            scale: depth * 18,
          };
        });
        const onMove = (event: MouseEvent) => {
          const rect = hero.getBoundingClientRect();
          const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          movers.forEach((mover) => {
            mover.x(nx * mover.scale);
            mover.y(ny * mover.scale);
          });
        };
        const onLeave = () => {
          movers.forEach((mover) => {
            mover.x(0);
            mover.y(0);
          });
        };
        hero.addEventListener("mousemove", onMove, { passive: true });
        hero.addEventListener("mouseleave", onLeave);
        cleanup.push(() => hero.removeEventListener("mousemove", onMove));
        cleanup.push(() => hero.removeEventListener("mouseleave", onLeave));

        document.querySelectorAll(".pat-shape").forEach((el, i) => {
          gsap.to(el, {
            y: (i % 2 === 0 ? 1 : -1) * (6 + (i % 3) * 4),
            x: (i % 3 === 0 ? 1 : -1) * (3 + (i % 2) * 3),
            rotation: (i % 2 === 0 ? 1 : -1) * (2 + (i % 4)),
            duration: 3.5 + (i % 5) * 1.1,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            delay: (i % 7) * 0.45,
          });
        });
      }

      const hash = window.location.hash.replace("#", "");
      if (hash && hash in tabLabels) {
        const nextTab = hash as ExpoTab;
        setActiveTab(nextTab);
        requestAnimationFrame(() => scrollToExpoTab(nextTab));
      }
      const onHashChange = () => {
        const next = window.location.hash.replace("#", "");
        if (next && next in tabLabels) {
          const nextTab = next as ExpoTab;
          setActiveTab(nextTab);
          requestAnimationFrame(() => scrollToExpoTab(nextTab));
        }
      };
      window.addEventListener("hashchange", onHashChange);
      cleanup.push(() => window.removeEventListener("hashchange", onHashChange));
    }

    void init();

    return () => {
      mounted = false;
      document.body.className = previous;
      cleanup.forEach((fn) => fn());
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const changeTab = async (tab: ExpoViewTab) => {
    closeMobileMenu();
    const currentPanel = document.querySelector<HTMLElement>(".panel.active");
    const nextPanel = document.getElementById(`panel-${tab}`);

    if (tab !== "exhibitor-detail") {
      window.history.replaceState(null, "", `#${tab}`);
      requestAnimationFrame(() => scrollToExpoTab(tab));
    }

    if (!currentPanel || !nextPanel || currentPanel === nextPanel) {
      setActiveTab(tab);
      return;
    }

    const gsapInstance = (window as Window & { gsap?: typeof import("gsap").gsap }).gsap;
    if (!gsapInstance) {
      setActiveTab(tab);
      return;
    }

    gsapInstance.to(currentPanel, {
      opacity: 0,
      scale: 0.98,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        setActiveTab(tab);
        requestAnimationFrame(() => {
          const panel = document.getElementById(`panel-${tab}`);
          if (!panel) return;
          gsapInstance.fromTo(
            panel,
            { opacity: 0, scale: 1.015, y: 8 },
            { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: "power3.out" },
          );
        });
      },
    });
  };

  const openExhibitor = async (slug: string) => {
    const exhibitor = exhibitorsData.find((item) => item.slug === slug) ?? null;
    if (!exhibitor) return;
    closeMobileMenu();
    setSelectedExhibitor(exhibitor);
    await changeTab("exhibitor-detail");
  };

  return (
    <>
      <PageBodyClass className="loading expo-page" />
      <BrandPreloader />

      <div className="topbar-shell">
        <div className="wrap topbar">
          <div className="topbar-left">
            <span>{homepageData.topbarTagline}</span>
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
          <Link className="logo-link" href="/">
            <img className="logo-mark logo-mark-default" src="/assets/logo-wordmark-light.svg" alt="Agri Africa" />
            <img className="logo-mark logo-mark-scroll" src="/assets/logo-wordmark-dark.svg" alt="" aria-hidden="true" />
            <img className="logo-mark logo-mark-icon" src="/assets/logo-icon.svg" alt="" aria-hidden="true" />
          </Link>
          <nav>
            <Link href="/">Home</Link>
            <div className="nav-item">
              <Link className="nav-parent" href="/2026-aiae-expo" style={{ color: "var(--leaf-500)" }}>
                2026 AIAE Expo
              </Link>
              <div className="nav-submenu">
                {(Object.keys(tabLabels) as ExpoTab[]).map((tab) => (
                  <a key={tab} href={`#${tab}`} onClick={(e) => { e.preventDefault(); changeTab(tab); }}>
                    {tabLabels[tab]}
                  </a>
                ))}
              </div>
            </div>
            <Link href="/gallery">Gallery</Link>
          </nav>
          <div className="nav-right">
            <button
              className="menu-toggle"
              id="menu-toggle"
              type="button"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span className="bars" aria-hidden="true">
                <span />
                <span />
              </span>{" "}
              Menu
            </button>
            <Link className="btn btn-accent sm" href="/visitor-registration">
              Register Now
            </Link>
          </div>
          <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`} id="mobile-menu">
            <Link href="/" onClick={closeMobileMenu}>Home</Link>
            {(Object.keys(tabLabels) as ExpoTab[]).map((tab) => (
              <a
                key={tab}
                href={`#${tab}`}
                onClick={(e) => {
                  e.preventDefault();
                  void changeTab(tab);
                }}
              >
                {tabLabels[tab]}
              </a>
            ))}
            <Link href="/gallery" onClick={closeMobileMenu}>Gallery</Link>
            <Link href="/visitor-registration" onClick={closeMobileMenu}>Register Now</Link>
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
            <span id="days-hero">— days to go</span>
          </div>
        </div>
      </section>

      <div className="wrap expo-wrap">
        <div className="expo-body">
          <aside className="expo-sidebar">
            <nav className="tab-nav" aria-label="Expo sections">
              <div className="tab-section-label">Information</div>
              <button className={`tab-item${activeTab === "overview" ? " active" : ""}`} onClick={() => void changeTab("overview")}>
                <span className="tab-icon" aria-hidden="true"><LayoutDashboard /></span>
                <span className="tab-label">Overview</span>
              </button>
              <button className={`tab-item${activeTab === "exhibitors" ? " active" : ""}`} onClick={() => void changeTab("exhibitors")}>
                <span className="tab-icon" aria-hidden="true"><Store /></span>
                <span className="tab-label">Exhibitors</span>
              </button>
              <button
                className={`tab-item exhibitor-detail-tab${activeTab === "exhibitor-detail" ? " active" : ""}`}
                hidden={!selectedExhibitor}
                onClick={() => void changeTab("exhibitor-detail")}
              >
                <span className="tab-icon" aria-hidden="true"><Building /></span>
                <span className="tab-label">{selectedExhibitor?.name ?? "Company"}</span>
              </button>
              <button className={`tab-item${activeTab === "support" ? " active" : ""}`} onClick={() => void changeTab("support")}>
                <span className="tab-icon" aria-hidden="true"><Building2 /></span>
                <span className="tab-label">Support Units</span>
              </button>
              <button className={`tab-item${activeTab === "floorplan" ? " active" : ""}`} onClick={() => void changeTab("floorplan")}>
                <span className="tab-icon" aria-hidden="true"><Map /></span>
                <span className="tab-label">Floor Plan</span>
              </button>
              <button className={`tab-item${activeTab === "programme" ? " active" : ""}`} onClick={() => void changeTab("programme")}>
                <span className="tab-icon" aria-hidden="true"><CalendarDays /></span>
                <span className="tab-label">Programme</span>
              </button>
            </nav>
            <div className="sidebar-footer">
            <div className="sidebar-meta">
                <span className="sidebar-event-title">{homepageData.eventFullTitle}</span>
                <strong>{expoPage.dates}</strong>
                {expoPage.venue}
              </div>
              <Link className="btn btn-accent block" href="/visitor-registration">
                Register Now →
              </Link>
            </div>
          </aside>

          <div className="expo-panels" id="expo-panels">
            <div className={`panel${activeTab === "overview" ? " active" : ""}`} id="panel-overview" style={{ display: activeTab === "overview" ? "block" : "none" }}>
              <div id="overview" className="panel-anchor" aria-hidden="true" />
              <ExpoOverview
                dates={expoPage.dates}
                venue={expoPage.venue}
                theme={expoPage.theme}
                overviewIntro={expoPage.overviewIntro}
                overviewBody={expoPage.overviewBody}
                overviewGuests={expoPage.overviewGuests}
                overviewObjectives={expoPage.overviewObjectives}
                overviewCategories={expoPage.overviewCategories}
              />
            </div>
            <ExhibitorsPanel active={activeTab === "exhibitors"} onOpenExhibitor={openExhibitor} exhibitorsData={exhibitorsData} />
            <ExhibitorDetailPanel active={activeTab === "exhibitor-detail"} exhibitor={selectedExhibitor} onBack={() => void changeTab("exhibitors")} />
            <SupportUnitsPanel active={activeTab === "support"} onOpenUnit={setSupportUnitModal} units={supportUnitsData} />
            <FloorPlanPanel active={activeTab === "floorplan"} floorPlanUrl={expoPage.floorPlanUrl} venue={expoPage.venue} />
            <ProgrammePanel active={activeTab === "programme"} programmeDaysData={programmeDaysData} />
          </div>
        </div>
      </div>

      <ExpoFooter homepage={homepageData} onPartnerClick={setPartnerModal} />

      <div className={`pmodal-overlay${partnerModal ? " open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="pmodal-title">
        <div className="pmodal">
          <button className="pmodal-close" aria-label="Close" type="button" onClick={() => setPartnerModal(null)}>
            ✕
          </button>
          <div className="pmodal-head">
            <div className="pmodal-badge-lg">{partnerModal?.badge}</div>
            <h2 className="pmodal-title" id="pmodal-title">{partnerModal?.title}</h2>
          </div>
          <div className="pmodal-section">
            <div className="pmodal-label">About</div>
            <p>{partnerModal?.about}</p>
          </div>
          <div className="pmodal-section">
            <div className="pmodal-label">Involvement</div>
            <p>{partnerModal?.involvement}</p>
          </div>
          <a className="btn btn-accent" href={partnerModal?.url ?? "#"} target="_blank" rel="noopener noreferrer">
            Visit Website →
          </a>
        </div>
      </div>

      <div className={`support-modal-overlay${supportUnitModal ? " open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
        <div className="support-modal">
          <button className="support-modal-close" type="button" aria-label="Close support unit details" onClick={() => setSupportUnitModal(null)}>
            ✕
          </button>
          <div className="support-modal-logo">
            {supportUnitModal ? <img src={supportUnitModal.logoSrc} alt={supportUnitModal.alt} /> : null}
          </div>
          <div className="support-modal-copy">
            <div className="support-modal-country">{supportUnitModal?.country}</div>
            <h2 id="support-modal-title">{supportUnitModal?.title}</h2>
            <p>{supportUnitModal?.description}</p>
          </div>
        </div>
      </div>
    </>
  );
}
