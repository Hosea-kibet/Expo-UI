"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  CalendarDays,
  Facebook,
  Handshake,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Store,
  Ticket,
  Youtube,
} from "lucide-react";
import { BrandPreloader } from "@/src/components/brand-preloader";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

const pillIcons = [Store, Handshake, CalendarDays] as const;

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

function splitHeroTitle(title: string, highlightText: string) {
  const normalizedHighlight = highlightText.trim();
  const lowerTitle = title.toLowerCase();
  const lowerHighlight = normalizedHighlight.toLowerCase();
  const highlightIndex = lowerTitle.indexOf(lowerHighlight);

  if (highlightIndex === -1 || normalizedHighlight.length === 0) {
    return {
      before: title,
      highlight: "",
      after: "",
    };
  }

  const before = title.slice(0, highlightIndex).trim();
  const highlight = title.slice(highlightIndex, highlightIndex + normalizedHighlight.length).trim();
  const after = title.slice(highlightIndex + normalizedHighlight.length).trim();

  return { before, highlight, after };
}

export default function HomepageClient({
  initialData,
}: {
  initialData: HomepageSnapshot;
}) {
  const titleParts = splitHeroTitle(initialData.title, initialData.highlightText);
  const afterWords = titleParts.after.split(" ").filter(Boolean);
  const afterPrefix = afterWords.slice(0, -1).join(" ");
  const afterEmphasis = afterWords.at(-1) ?? "";

  useEffect(() => {
    let mounted = true;
    const cleanup: Array<() => void> = [];
    const previousBodyClassName = document.body.className;
    document.body.className = "loading";

    async function init() {
      const { gsap } = (await import("gsap")) as { gsap: typeof import("gsap").default };
      if (!mounted) return;
      (window as Window & { gsap?: typeof gsap }).gsap = gsap;

      const nav = document.getElementById("nav");
      const preloader = document.getElementById("preloader");
      const menuToggle = document.getElementById("menu-toggle");
      const mobileMenu = document.getElementById("mobile-menu");

      const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 24);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanup.push(() => window.removeEventListener("scroll", onScroll));

      if (menuToggle && mobileMenu && nav) {
        const setMenu = (open: boolean) => {
          mobileMenu.classList.toggle("open", open);
          menuToggle.setAttribute("aria-expanded", String(open));
        };

        const onMenuClick = () => setMenu(!mobileMenu.classList.contains("open"));
        const onDocumentClick = (event: MouseEvent) => {
          if (event.target instanceof Node && !nav.contains(event.target)) setMenu(false);
        };
        const onResize = () => {
          if (window.innerWidth > 920) setMenu(false);
        };

        menuToggle.addEventListener("click", onMenuClick);
        mobileMenu.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => setMenu(false));
        });
        document.addEventListener("click", onDocumentClick);
        window.addEventListener("resize", onResize, { passive: true });

        cleanup.push(() => menuToggle.removeEventListener("click", onMenuClick));
        cleanup.push(() => document.removeEventListener("click", onDocumentClick));
        cleanup.push(() => window.removeEventListener("resize", onResize));
      }

      const updateCountdown = () => {
        const target = new Date("2026-10-23T00:00:00");
        const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
        const el = document.getElementById("days");
        const label = document.getElementById("days-label");
        if (!el || !label) return;

        if (diff > 0) {
          el.textContent = `${diff}`;
          label.textContent = diff === 1 ? "day to go" : "days to go";
          el.style.fontSize = "";
        } else if (diff === 0) {
          el.textContent = "Today";
          label.textContent = "is the day";
          el.style.fontSize = "15px";
        } else {
          el.textContent = "Thank you";
          label.textContent = "see you next year";
          el.style.fontSize = "15px";
        }
      };
      updateCountdown();

      const splitToChars = (el: Element): HTMLSpanElement[] => {
        let chars: HTMLSpanElement[] = [];
        Array.from(el.childNodes).forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent ?? "";
            const fragment = document.createDocumentFragment();
            for (const character of text) {
              const span = document.createElement("span");
              span.className = "h-char";
              span.textContent = character;
              fragment.appendChild(span);
              chars.push(span);
            }
            node.parentNode?.replaceChild(fragment, node);
          } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() !== "svg"
          ) {
            chars = chars.concat(splitToChars(node as Element));
          }
        });
        return chars;
      };

      const initHeroSequence = () => {
        const heroCopy = document.querySelector(".hero-copy");
        if (!heroCopy || !window.gsap) {
          if (heroCopy) {
            heroCopy.querySelectorAll(".reveal, .reveal-up").forEach((el) => el.classList.add("in"));
          }
          const fallbackSupporters = heroCopy?.querySelector(".hero-supporters");
          if (fallbackSupporters) fallbackSupporters.classList.add("is-visible");
          const path = document.querySelector(".title-swoosh path");
          if (path instanceof SVGPathElement) {
            path.style.strokeDasharray = "none";
            path.style.strokeDashoffset = "0";
          }
          return;
        }

        const eyebrow = heroCopy.querySelector(".eyebrow");
        const heading = heroCopy.querySelector("h1");
        const lead = heroCopy.querySelector(".lead");
        const pillsWrap = heroCopy.querySelector(".pills");
        const pills = Array.from(heroCopy.querySelectorAll(".pill"));
        const supportersWrap = heroCopy.querySelector(".hero-supporters");
        const supportersLabel = heroCopy.querySelector(".hero-supporters-label");
        const supporterLogos = Array.from(heroCopy.querySelectorAll(".hero-supporter"));
        const swoosh = document.querySelector(".title-swoosh path");
        const chars = heading ? splitToChars(heading) : [];

        if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 10, filter: "blur(0px)" });
        if (heading) gsap.set(heading, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" });
        if (chars.length > 0) gsap.set(chars, { opacity: 0 });
        if (lead) gsap.set(lead, { opacity: 0, y: 10, filter: "blur(0px)" });
        if (pillsWrap) gsap.set(pillsWrap, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" });
        if (pills.length > 0) gsap.set(pills, { opacity: 0, y: 14 });
        if (supportersWrap) gsap.set(supportersWrap, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" });
        if (supportersLabel) gsap.set(supportersLabel, { opacity: 0, y: 8 });
        if (supporterLogos.length > 0) {
          gsap.set(supporterLogos, { opacity: 0, scale: 0.88, transformOrigin: "center center" });
        }
        if (swoosh instanceof SVGPathElement) {
          const len = swoosh.getTotalLength();
          gsap.set(swoosh, { strokeDasharray: len, strokeDashoffset: len });
        }

        const tl = gsap.timeline({ delay: 0.15 });
        if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" });
        if (chars.length > 0) {
          tl.to(chars, { opacity: 1, duration: 0.001, stagger: { each: 0.032, from: "start" }, ease: "none" }, "+=0.12");
        }
        if (lead) tl.to(lead, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, "+=0.1");
        if (swoosh instanceof SVGPathElement) {
          tl.set(swoosh, { opacity: 1 }, "<");
          tl.to(swoosh, { strokeDashoffset: 0, duration: 0.85, ease: "power2.out" }, "<");
        }
        if (pills.length > 0) {
          tl.to(pills, { opacity: 1, y: 0, duration: 0.38, stagger: 0.1, ease: "power2.out" }, "+=0.06");
        }
        if (supporterLogos.length > 0) {
          tl.to(supporterLogos, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.35)" }, pills.length > 0 ? "<" : "+=0.06");
        }
        if (supportersLabel) {
          tl.to(supportersLabel, { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" }, supporterLogos.length > 0 ? "<" : "+=0.06");
        }
      };

      const initReveals = (() => {
        let ran = false;
        return () => {
          if (ran) return;
          ran = true;

          const prefersMotion = window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches ?? true;
          if (prefersMotion) {
            initHeroSequence();
          } else {
            const heroCopy = document.querySelector(".hero-copy");
            if (heroCopy) {
              heroCopy.querySelectorAll(".reveal, .reveal-up").forEach((el) => el.classList.add("in"));
            }
            const path = document.querySelector(".title-swoosh path");
            if (path instanceof SVGPathElement) {
              path.style.strokeDasharray = "none";
              path.style.strokeDashoffset = "0";
            }
          }

          const heroCopy = document.querySelector(".hero-copy");
          const revealables = Array.from(document.querySelectorAll(".reveal, .reveal-up")).filter(
            (el) => !heroCopy || !heroCopy.contains(el),
          );

          if (!prefersMotion || !("IntersectionObserver" in window)) {
            revealables.forEach((el) => el.classList.add("in"));
            return;
          }

          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("in");
                observer.unobserve(entry.target);
              });
            },
            { threshold: 0.1, rootMargin: "0px 0px -4% 0px" },
          );

          revealables.forEach((el, index) => {
            if (!el.classList.contains("reveal-up")) {
              (el as HTMLElement).style.transitionDelay = `${Math.min(index * 0.07, 0.28)}s`;
            }
            observer.observe(el);
          });

          cleanup.push(() => observer.disconnect());
        };
      })();

      const notifyPreloaderDone = () => document.dispatchEvent(new CustomEvent("preloader-done"));

      if (!preloader) {
        document.body.classList.remove("loading");
        initReveals();
      } else {
        document.documentElement.classList.remove("no-gsap");
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
          .to(preloader, {
            opacity: 0,
            duration: 0.7,
            delay: 0.55,
            ease: "power2.inOut",
            onComplete: () => {
              preloader.classList.add("done");
              initReveals();
              notifyPreloaderDone();
            },
          });

        const safetyTimer = window.setTimeout(() => {
          if (preloader.classList.contains("done")) return;
          tl.kill();
          preloader.style.opacity = "0";
          preloader.classList.add("done");
          document.body.classList.remove("loading");
          initReveals();
        }, 6000);
        cleanup.push(() => window.clearTimeout(safetyTimer));
      }

      const settledPreloader = document.getElementById("preloader");
      if (settledPreloader?.classList.contains("done")) initReveals();

      const ticket = document.getElementById("event");
      const hero = document.querySelector<HTMLElement>(".hero");
      const canFloat = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
      const motionOk = window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches ?? true;
      if (ticket && hero && canFloat && motionOk && window.gsap) {
        gsap.set(ticket, { position: "relative", left: 0, top: 0 });
        const moveX = gsap.quickTo(ticket, "left", { duration: 0.78, ease: "power3.out" });
        const moveY = gsap.quickTo(ticket, "top", { duration: 0.78, ease: "power3.out" });

        const onMove = (event: MouseEvent) => {
          const rect = hero.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          moveX(px * 30);
          moveY(py * 22);
          ticket.classList.add("is-floating");
        };

        const onLeave = () => {
          moveX(0);
          moveY(0);
          ticket.classList.remove("is-floating");
        };

        hero.addEventListener("mousemove", onMove);
        hero.addEventListener("mouseleave", onLeave);
        cleanup.push(() => hero.removeEventListener("mousemove", onMove));
        cleanup.push(() => hero.removeEventListener("mouseleave", onLeave));
      }

      const ticketCard = document.querySelector<HTMLElement>("#event .ticket");
      const perf = ticketCard?.querySelector<HTMLElement>(".perf");
      if (ticketCard && perf) {
        const punch = () => {
          const radius = 13;
          const y = perf.offsetTop;
          const mask =
            `radial-gradient(circle ${radius}px at 0px ${y}px, transparent ${radius - 1}px, #000 ${radius}px),` +
            `radial-gradient(circle ${radius}px at 100% ${y}px, transparent ${radius - 1}px, #000 ${radius}px)`;
          ticketCard.style.webkitMaskImage = mask;
          ticketCard.style.maskImage = mask;
          ticketCard.style.webkitMaskComposite = "source-in";
          ticketCard.style.maskComposite = "intersect";
        };

        punch();
        window.addEventListener("resize", punch, { passive: true });
        cleanup.push(() => window.removeEventListener("resize", punch));

        if (window.ResizeObserver) {
          const observer = new ResizeObserver(punch);
          observer.observe(ticketCard);
          cleanup.push(() => observer.disconnect());
        }

        const timeoutId = window.setTimeout(punch, 350);
        cleanup.push(() => window.clearTimeout(timeoutId));
      }

      const video = document.getElementById("hero-video") as HTMLVideoElement | null;
      if (video) {
        video.removeAttribute("loop");
        let loopFading = false;

        const fadeIn = () => {
          gsap.to(video, { opacity: 1, duration: 1.8, ease: "power2.out" });
        };

        const startVideo = () => {
          void video.play().then(() => {
            video.classList.add("playing");
            fadeIn();
          }).catch(() => undefined);
        };

        const schedulePlay = () => {
          const timeoutId = window.setTimeout(() => {
            if (video.readyState >= 3) {
              startVideo();
            } else {
              video.addEventListener("canplaythrough", startVideo, { once: true });
            }
          }, 3000);
          cleanup.push(() => window.clearTimeout(timeoutId));
        };

        if (preloader?.classList.contains("done")) schedulePlay();
        else document.addEventListener("preloader-done", schedulePlay, { once: true });

        const onTimeUpdate = () => {
          if (!video.duration || loopFading) return;
          const remaining = video.duration - video.currentTime;
          if (remaining < 1.4) {
            loopFading = true;
            gsap.to(video, { opacity: 0, duration: 1.2, ease: "power2.in" });
          }
        };

        const onEnded = () => {
          loopFading = false;
          video.currentTime = 0;
          void video.play().catch(() => undefined);
          gsap.to(video, { opacity: 1, duration: 1.8, delay: 0.1, ease: "power2.out" });
        };

        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("ended", onEnded);
        cleanup.push(() => video.removeEventListener("timeupdate", onTimeUpdate));
        cleanup.push(() => video.removeEventListener("ended", onEnded));
      }

      const overlay = document.getElementById("pmodal-overlay");
      const badge = document.getElementById("pmodal-badge");
      const title = document.getElementById("pmodal-title");
      const about = document.getElementById("pmodal-about");
      const involvement = document.getElementById("pmodal-involvement");
      const partnerLink = document.getElementById("pmodal-link") as HTMLAnchorElement | null;
      const closeBtn = document.getElementById("pmodal-close");

      if (overlay && badge && title && about && involvement && partnerLink) {
        const openModal = (element: HTMLElement) => {
          badge.textContent = element.dataset.badge ?? "";
          title.textContent = element.dataset.title ?? "";
          about.textContent = element.dataset.about ?? "";
          involvement.textContent = element.dataset.involvement ?? "";
          partnerLink.href = element.dataset.url ?? "#";
          overlay.classList.add("open");
          document.body.style.overflow = "hidden";
          gsap.fromTo(".pmodal", { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" });
        };

        const closeModal = () => {
          gsap.to(".pmodal", {
            opacity: 0,
            y: 12,
            scale: 0.97,
            duration: 0.22,
            ease: "power2.in",
            onComplete: () => {
              overlay.classList.remove("open");
              document.body.style.overflow = "";
            },
          });
        };

        const onClick = (event: MouseEvent) => {
          const target = event.target as HTMLElement | null;
          const partner = target?.closest(".ptn-link") as HTMLElement | null;
          if (partner) {
            event.preventDefault();
            openModal(partner);
            return;
          }
          if (event.target === overlay) closeModal();
        };

        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === "Escape" && overlay.classList.contains("open")) closeModal();
        };

        document.addEventListener("click", onClick);
        closeBtn?.addEventListener("click", closeModal);
        document.addEventListener("keydown", onKeyDown);

        cleanup.push(() => document.removeEventListener("click", onClick));
        cleanup.push(() => closeBtn?.removeEventListener("click", closeModal));
        cleanup.push(() => document.removeEventListener("keydown", onKeyDown));
      }
    }

    void init();

    return () => {
      mounted = false;
      document.body.className = previousBodyClassName;
      cleanup.forEach((fn) => fn());
    };
  }, []);

  return (
    <>
      <BrandPreloader />

      <div className="topbar-shell">
        <div className="wrap topbar">
          <div className="topbar-left">
            <span>{initialData.topbarTagline}</span>
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
            <a href="#contact">Gallery</a>
          </nav>
          <div className="nav-right">
            <button className="menu-toggle" id="menu-toggle" type="button" aria-controls="mobile-menu" aria-expanded="false">
              <span className="bars" aria-hidden="true">
                <span />
                <span />
              </span>{" "}
              Menu
            </button>
            <Link className="btn btn-secondary" href="/visitor-registration">
              Register Now
            </Link>
          </div>
          <div className="mobile-menu" id="mobile-menu">
            <Link href="/">Home</Link>
            <Link href="/2026-aiae-expo">2026 AIAE Expo</Link>
            <Link href="/2026-aiae-expo#overview">Overview</Link>
            <Link href="/2026-aiae-expo#exhibitors">Exhibitors</Link>
            <Link href="/2026-aiae-expo#support">Support Units</Link>
            <Link href="/2026-aiae-expo#floorplan">Floor Plan</Link>
            <Link href="/2026-aiae-expo#programme">Programme</Link>
            <a href="#contact">Gallery</a>
            <Link href="/visitor-registration">Register Now</Link>
          </div>
        </div>
      </header>

      <div className="hero" id="top">
        <div className="bg hero-media" id="hero-media">
          <img className="hero-poster" src={initialData.heroImageUrl} alt="" aria-hidden="true" />
          <video className="hero-video" id="hero-video" muted loop playsInline preload="auto" poster={initialData.heroImageUrl}>
            <source src={initialData.heroVideoUrl} type="video/mp4" />
          </video>
        </div>
        <div className="tint" />
        <div className="glow" />
        <div className="grain" />
        <div className="hero-main">
          <div className="wrap grid">
            <div className="hero-copy">
              <div className="eyebrow reveal" style={{ animationDelay: ".05s" }}>
                <span style={{ color: "var(--harvest-300)", fontWeight: 800 }}>{initialData.heroEyebrowPrimary}</span>
                <span style={{ color: "rgba(246,241,230,.45)", margin: "0 6px" }}>·</span>
                <span style={{ color: "rgba(246,241,230,.7)" }}>{initialData.heroEyebrowSecondary}</span>
              </div>
              <h1 className="reveal" style={{ animationDelay: ".12s" }}>
                <span style={{ color: "#fff" }}>{titleParts.before}</span>
                {titleParts.highlight ? <> <span className="accent">{titleParts.highlight}</span></> : null}
                {titleParts.after ? (
                  <>
                    <br className="hero-title-break" />
                    {afterPrefix ? `${afterPrefix} ` : ""}
                    <span className="swoosh-word">
                      {afterEmphasis}
                      <svg className="title-swoosh" viewBox="0 0 260 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                        <path className="swoosh-main" d="M0 18 C52 5, 112 25, 158 14 S224 7, 260 16" />
                      </svg>
                    </span>
                  </>
                ) : null}
              </h1>
              <p className="lead reveal" style={{ animationDelay: ".22s" }}>
                {initialData.subtitle}
              </p>
              <div className="pills reveal" style={{ animationDelay: ".32s" }}>
                {initialData.heroPills.map((pill, index) => {
                  const Icon = pillIcons[index] ?? Store;
                  return (
                    <span className="pill" key={pill}>
                      <Icon style={{ width: 15, height: 15 }} /> {pill}
                    </span>
                  );
                })}
              </div>
              <div className="hero-supporters" aria-label="Event supporters">
                <span className="hero-supporters-label">{initialData.organiserLabel}</span>
                <div className="hero-supporters-logos">
                  <div className="hero-supporter ministry-supporter">
                    <img src={initialData.organiserPrimaryLogoUrl} alt={initialData.organiserPrimaryLogoAlt} />
                  </div>
                  <div className="hero-supporter hxie-supporter" aria-label={initialData.organiserSecondaryTitle}>
                    <strong>{initialData.organiserSecondaryTitle}</strong>
                    <span>{initialData.organiserSecondarySubtitle}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ticket-float reveal" id="event" style={{ animationDelay: ".3s" }}>
              <div className="ticket">
                <div className="top">
                  <div className="status">
                    <span className="dot" /> {initialData.eventStatus}
                  </div>
                  <h2>{initialData.eventName}</h2>
                  <p className="full">{initialData.eventFullTitle}</p>
                  <div className="facts">
                    <div className="fact">
                      <CalendarDays style={{ width: 22, height: 22 }} />
                      <div>
                        <div className="k">Dates</div>
                        <div className="v">{initialData.eventDates}</div>
                      </div>
                    </div>
                    <div className="fact">
                      <MapPin style={{ width: 22, height: 22 }} />
                      <div>
                        <div className="k">Venue</div>
                        <div className="v">{initialData.eventVenue}</div>
                      </div>
                    </div>
                  </div>
                  <div className="countdown">
                    <b id="days">—</b> <span id="days-label">days to go</span>
                  </div>
                </div>
                <div className="perf" />
                <div className="bot">
                  <div className="actions">
                    <Link className="btn btn-accent lg block" href="/visitor-registration">
                      <Ticket /> Register Now
                    </Link>
                    <div className="or">or</div>
                    <Link className="btn btn-ghost block" href="/2026-aiae-expo">
                      Explore the Expo <ArrowRight style={{ width: 16, height: 16 }} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="news">
        <div className="wrap grid event-register-cta">
          <div className="reveal-up">
            <div className="eyebrow" style={{ color: "var(--harvest-100)" }}>
              {initialData.registrationEyebrow}
            </div>
            <h3>{initialData.registrationTitle}</h3>
            <div className="event-register-details">
              <span>
                <CalendarDays /> {initialData.registrationDates}
              </span>
              <span>
                <MapPin /> {initialData.registrationVenue}
              </span>
            </div>
          </div>
          <div className="event-register-action reveal-up" style={{ transitionDelay: ".14s" }}>
            <p>{initialData.registrationBody}</p>
            <Link className="btn btn-light lg" href="/visitor-registration">
              Register Now <ArrowRight />
            </Link>
          </div>
        </div>
      </div>

      <footer className="site" id="contact">
        <div className="wrap inner">
          <div className="foot-grid">
            <div className="foot-brand reveal-up">
              <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
              <p>{initialData.footerBrandCopy}</p>
              <div className="socials">
                {initialData.socialLinks.map((social) => {
                  const Icon = getSocialIcon(social.platform);
                  return (
                    <a href={social.url} aria-label={social.platform[0].toUpperCase() + social.platform.slice(1)} key={social.platform}>
                      <Icon style={{ width: 16, height: 16 }} />
                    </a>
                  );
                })}
              </div>
            </div>
            <div className="foot-col reveal-up" style={{ transitionDelay: ".1s" }}>
              <div className="h">Expo</div>
              <Link href="/2026-aiae-expo">2026 Expo page</Link>
              <Link href="/visitor-registration">Register Now</Link>
              <a href="/#gallery">Gallery</a>
            </div>
            <div className="foot-col reveal-up" style={{ transitionDelay: ".2s" }}>
              <div className="h">Partners</div>
              {initialData.partners.map((partner) => (
                <a
                  href="#"
                  className="ptn-link"
                  data-badge={partner.badge}
                  data-title={partner.title}
                  data-about={partner.about}
                  data-involvement={partner.involvement}
                  data-url={partner.url}
                  key={partner.name}
                >
                  {partner.name}
                </a>
              ))}
            </div>
          </div>
          <div className="contact reveal-up" style={{ transitionDelay: ".12s" }}>
            <div className="item">
              <Phone style={{ width: 16, height: 16 }} /> {initialData.phone}
            </div>
            <div className="item">
              <Mail style={{ width: 16, height: 16 }} /> {initialData.email}
            </div>
            <div className="item">
              <MapPin style={{ width: 16, height: 16 }} /> {initialData.address}
            </div>
          </div>
          <div className="legal reveal-up" style={{ transitionDelay: ".22s" }}>
            <span>{initialData.legalLeft}</span>
            <span>{initialData.legalRight}</span>
          </div>
        </div>
      </footer>

      <div className="pmodal-overlay" id="pmodal-overlay" role="dialog" aria-modal="true" aria-labelledby="pmodal-title">
        <div className="pmodal">
          <button className="pmodal-close" id="pmodal-close" aria-label="Close" type="button">
            ✕
          </button>
          <div className="pmodal-head">
            <div className="pmodal-badge-lg" id="pmodal-badge" />
            <h2 className="pmodal-title" id="pmodal-title" />
          </div>
          <div className="pmodal-section">
            <div className="pmodal-label">About</div>
            <p id="pmodal-about" />
          </div>
          <div className="pmodal-section">
            <div className="pmodal-label">Involvement</div>
            <p id="pmodal-involvement" />
          </div>
          <a className="btn btn-accent" id="pmodal-link" target="_blank" rel="noopener noreferrer">
            Visit Website →
          </a>
        </div>
      </div>
    </>
  );
}
