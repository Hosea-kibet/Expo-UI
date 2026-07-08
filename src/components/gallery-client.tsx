"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Facebook,
  ImageIcon,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Play,
  X,
  Youtube,
} from "lucide-react";
import { PageBodyClass } from "@/src/components/page-body-class";
import { LegalFooterLinks } from "@/src/components/legal-links";
import type { GallerySnapshotItem } from "@/src/lib/gallery-cms";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

function getSocialIcon(platform: HomepageSnapshot["socialLinks"][number]["platform"]) {
  switch (platform) {
    case "facebook":
      return Facebook;
    case "instagram":
      return Instagram;
    case "youtube":
      return Youtube;
    case "linkedin":
      return Linkedin;
  }
}

export default function GalleryClient({
  homepage,
  items,
}: {
  homepage: HomepageSnapshot;
  items: GallerySnapshotItem[];
}) {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const years = useMemo(
    () => Array.from(new Set(items.map((item) => item.year))),
    [items],
  );

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (yearFilter === "all" || item.year === yearFilter) &&
          (typeFilter === "all" || item.type === typeFilter),
      ),
    [items, typeFilter, yearFilter],
  );

  useEffect(() => {
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 24);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      document.body.classList.remove("gallery-modal-open");
      return;
    }

    document.body.classList.add("gallery-modal-open");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
        return;
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + visibleItems.length) % visibleItems.length);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % visibleItems.length);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("gallery-modal-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen, visibleItems.length]);

  useEffect(() => {
    if (visibleItems.length === 0) {
      setModalOpen(false);
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => Math.min(current, visibleItems.length - 1));
  }, [visibleItems.length]);

  const activeItem = visibleItems[activeIndex] ?? null;

  const openModal = (item: GallerySnapshotItem) => {
    const nextIndex = visibleItems.findIndex((visibleItem) => visibleItem === item);
    if (nextIndex === -1) return;
    setActiveIndex(nextIndex);
    setModalOpen(true);
  };

  return (
    <>
      <PageBodyClass className="gallery-page" />

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
          <Link className="logo-link" href="/">
            <img className="logo-mark logo-mark-default" src="/assets/logo-wordmark-light.svg" alt="Agri Africa" />
            <img className="logo-mark logo-mark-scroll" src="/assets/logo-wordmark-dark.svg" alt="" aria-hidden="true" />
            <img className="logo-mark logo-mark-icon" src="/assets/logo-icon.svg" alt="" aria-hidden="true" />
          </Link>

          <nav>
            <Link href="/">Home</Link>
            <div className="nav-item">
              <Link className="nav-parent" href="/2026-aiae-expo">
                2026 AIAE Expo
              </Link>
              <div className="nav-submenu">
                <Link href="/2026-aiae-expo#overview">Overview</Link>
                <Link href="/2026-aiae-expo#exhibitors">Exhibitors</Link>
                <Link href="/2026-aiae-expo#support">Support Units</Link>
                <Link href="/2026-aiae-expo#floorplan">Floor Plan</Link>
                <Link href="/2026-aiae-expo#programme">Programme</Link>
              </div>
            </div>
            <Link href="/gallery" style={{ color: "var(--leaf-500)" }} aria-current="page">
              Gallery
            </Link>
          </nav>

          <div className="nav-right">
            <button
              className="menu-toggle"
              id="menu-toggle"
              type="button"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <span className="bars" aria-hidden="true">
                <span />
                <span />
              </span>
              Menu
            </button>
            <Link className="btn btn-accent sm" href="/visitor-registration">
              Register Now
            </Link>
          </div>

          <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`} id="mobile-menu">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <div className="mobile-nav-group">
              <Link className="mobile-nav-parent" href="/2026-aiae-expo" onClick={() => setMobileMenuOpen(false)}>
                2026 AIAE Expo
              </Link>
              <div className="mobile-nav-children">
                <Link href="/2026-aiae-expo#overview" onClick={() => setMobileMenuOpen(false)}>
                  Overview
                </Link>
                <Link href="/2026-aiae-expo#exhibitors" onClick={() => setMobileMenuOpen(false)}>
                  Exhibitors
                </Link>
                <Link href="/2026-aiae-expo#support" onClick={() => setMobileMenuOpen(false)}>
                  Support Units
                </Link>
                <Link href="/2026-aiae-expo#floorplan" onClick={() => setMobileMenuOpen(false)}>
                  Floor Plan
                </Link>
                <Link href="/2026-aiae-expo#programme" onClick={() => setMobileMenuOpen(false)}>
                  Programme
                </Link>
              </div>
            </div>
            <Link href="/gallery" aria-current="page" onClick={() => setMobileMenuOpen(false)}>
              Gallery
            </Link>
            <Link href="/visitor-registration" onClick={() => setMobileMenuOpen(false)}>
              Register Now
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="gallery-hero">
          <div className="wrap">
            <div className="eyebrow">Agri Africa media archive</div>
            <h1 className="hero-title">Past Events Gallery</h1>
            <p>Moments, conversations, and agricultural connections from Agri Africa&apos;s 2024 and 2025 events.</p>
          </div>
        </section>

        <section className="gallery-library wrap" aria-labelledby="gallery-library-title">
          <div className="gallery-library-head">
            <div>
              <div className="eyebrow">Explore the archive</div>
              <h2 id="gallery-library-title">Event media</h2>
            </div>
            <p aria-live="polite">
              {visibleItems.length} media item{visibleItems.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="gallery-filters" aria-label="Gallery filters">
            <div className="gallery-filter-group" role="group" aria-label="Filter by year">
              <button
                className={`gallery-filter${yearFilter === "all" ? " active" : ""}`}
                type="button"
                onClick={() => setYearFilter("all")}
              >
                All years
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  className={`gallery-filter${yearFilter === year ? " active" : ""}`}
                  type="button"
                  onClick={() => setYearFilter(year)}
                >
                  {year}
                </button>
              ))}
            </div>

            <div className="gallery-filter-group" role="group" aria-label="Filter by media type">
              <button
                className={`gallery-filter${typeFilter === "all" ? " active" : ""}`}
                type="button"
                onClick={() => setTypeFilter("all")}
              >
                All media
              </button>
              <button
                className={`gallery-filter${typeFilter === "image" ? " active" : ""}`}
                type="button"
                onClick={() => setTypeFilter("image")}
              >
                <ImageIcon />
                Images
              </button>
              <button
                className={`gallery-filter${typeFilter === "video" ? " active" : ""}`}
                type="button"
                onClick={() => setTypeFilter("video")}
              >
                <Play />
                Videos
              </button>
            </div>
          </div>

          <div className="gallery-grid" id="gallery-grid">
            {items.map((item) => {
              const hidden =
                (yearFilter !== "all" && item.year !== yearFilter) ||
                (typeFilter !== "all" && item.type !== typeFilter);

              return (
                <button
                  key={`${item.year}-${item.type}-${item.title}`}
                  className={`gallery-item${item.wide ? " gallery-item-wide" : ""}`}
                  type="button"
                  hidden={hidden}
                  onClick={() => openModal(item)}
                >
                  {item.type === "video" ? (
                    <video muted playsInline preload="metadata" poster={item.poster}>
                      <source src={item.src} type="video/mp4" />
                    </video>
                  ) : (
                    <img src={item.src} alt={item.alt} />
                  )}
                  <span className="gallery-item-overlay">
                    {item.type === "video" ? (
                      <span className="gallery-media-icon">
                        <Play />
                      </span>
                    ) : null}
                    <span>
                      <small>
                        {item.year} · {item.type === "image" ? "Image" : "Video"}
                      </small>
                      <strong>{item.title}</strong>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="gallery-empty" hidden={visibleItems.length !== 0}>
            No media matches these filters.
          </p>
          <p className="gallery-empty" hidden={items.length !== 0}>
            No gallery items have been published in the CMS yet.
          </p>
        </section>
      </main>

      <section className="news">
        <div className="wrap grid event-register-cta">
          <div>
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
          <div className="event-register-action">
            <p>{homepage.registrationBody}</p>
            <Link className="btn btn-light lg" href="/visitor-registration">
              Register Now <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <footer className="site" id="contact">
        <div className="wrap inner">
          <div className="foot-grid">
            <div className="foot-brand">
              <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
              <p>{homepage.footerBrandCopy}</p>
              <div className="socials">
                {homepage.socialLinks.map((social) => {
                  const Icon = getSocialIcon(social.platform);
                  return (
                    <a href={social.url} aria-label={social.platform[0].toUpperCase() + social.platform.slice(1)} key={social.platform}>
                      <Icon style={{ width: 16, height: 16 }} />
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="foot-col">
              <div className="h">Expo</div>
              <Link href="/2026-aiae-expo">2026 Expo page</Link>
              <Link href="/visitor-registration">Register Now</Link>
              <Link href="/gallery">Gallery</Link>
            </div>
            <div className="foot-col">
              <div className="h">Partners</div>
              {homepage.partners.map((partner) => (
                <a className="ptn-link" href={partner.url} target="_blank" rel="noopener noreferrer" key={partner.name}>
                  {partner.name}
                </a>
              ))}
            </div>
          </div>
          <div className="contact">
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
          <div className="legal">
            <span>{homepage.legalLeft}</span>
            <span><LegalFooterLinks /></span>
            <span>{homepage.legalRight}</span>
          </div>
        </div>
      </footer>

      <div className="gallery-modal" role="dialog" aria-modal="true" aria-labelledby="gallery-modal-title" hidden={!modalOpen}>
        <div className="gallery-modal-backdrop" onClick={() => setModalOpen(false)} />
        <div className="gallery-modal-dialog">
          <button className="gallery-modal-close" type="button" aria-label="Close gallery" onClick={() => setModalOpen(false)}>
            <X />
          </button>
          <button
            className="gallery-carousel-control previous"
            type="button"
            aria-label="Previous media"
            onClick={() => setActiveIndex((current) => (current - 1 + visibleItems.length) % visibleItems.length)}
          >
            <ChevronLeft />
          </button>
          <div className="gallery-modal-media" id="gallery-modal-media">
            {activeItem?.type === "video" ? (
              <video controls autoPlay playsInline poster={activeItem.poster}>
                <source src={activeItem.src} type="video/mp4" />
              </video>
            ) : activeItem ? (
              <img src={activeItem.src} alt={activeItem.title} />
            ) : null}
          </div>
          <button
            className="gallery-carousel-control next"
            type="button"
            aria-label="Next media"
            onClick={() => setActiveIndex((current) => (current + 1) % visibleItems.length)}
          >
            <ChevronRight />
          </button>
          <div className="gallery-modal-caption">
            <small id="gallery-modal-meta">
              {activeItem ? `${activeItem.year} · ${activeItem.type}` : ""}
            </small>
            <h2 id="gallery-modal-title">{activeItem?.title ?? ""}</h2>
            <p id="gallery-modal-description">{activeItem?.caption ?? ""}</p>
          </div>
        </div>
      </div>
    </>
  );
}
