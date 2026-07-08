import Link from "next/link";
import { CalendarDays, Facebook, Instagram, Linkedin, MapPin, Mail, Phone, Youtube } from "lucide-react";
import { LegalFooterLinks } from "@/src/components/legal-links";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

export function ExpoFooter({ homepage }: { homepage: HomepageSnapshot }) {
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
              <span><CalendarDays /> {homepage.registrationDates}</span>
              <span><MapPin /> {homepage.registrationVenue}</span>
            </div>
          </div>
          <div className="event-register-action reveal-up in" style={{ transitionDelay: ".14s" }}>
            <p>{homepage.registrationBody}</p>
            <Link className="btn btn-light lg" href="/visitor-registration">Register Now</Link>
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
                <a key={partner.name} href={partner.url} target="_blank" rel="noopener noreferrer">
                  {partner.name}
                </a>
              ))}
            </div>
          </div>
          <div className="contact reveal-up in" style={{ transitionDelay: ".12s" }}>
            <div className="item"><Phone style={{ width: 16, height: 16 }} /> {homepage.phone}</div>
            <div className="item"><Mail style={{ width: 16, height: 16 }} /> {homepage.email}</div>
            <div className="item"><MapPin style={{ width: 16, height: 16 }} /> {homepage.address}</div>
          </div>
          <div className="legal reveal-up in" style={{ transitionDelay: ".22s" }}>
            <span>{homepage.legalLeft}</span>
            <span><LegalFooterLinks /></span>
            <span>{homepage.legalRight}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
