import Link from "next/link";
import { CalendarDays, Facebook, Instagram, Linkedin, MapPin, Mail, Phone, Youtube } from "lucide-react";

export function ExpoFooter() {
  return (
    <>
      <div className="news">
        <div className="wrap grid event-register-cta">
          <div className="reveal-up in">
            <div className="eyebrow" style={{ color: "var(--harvest-100)" }}>
              Registration is open
            </div>
            <h3>2026 - Africa International Agricultural Expo</h3>
            <div className="event-register-details">
              <span><CalendarDays /> 27–30 October 2026</span>
              <span><MapPin /> KICC, Nairobi, Kenya</span>
            </div>
          </div>
          <div className="event-register-action reveal-up in" style={{ transitionDelay: ".14s" }}>
            <p>Meet exhibitors, explore agricultural innovation, and build valuable connections across Africa&apos;s value chains.</p>
            <Link className="btn btn-light lg" href="/visitor-registration">Register Now</Link>
          </div>
        </div>
      </div>

      <footer className="site" id="contact">
        <div className="wrap inner">
          <div className="foot-grid">
            <div className="foot-brand reveal-up in">
              <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
              <p>An events company cultivating success in agriculture — making farming a desirable and dignified vocation.</p>
              <div className="socials">
                <a href="#" aria-label="Facebook"><Facebook style={{ width: 16, height: 16 }} /></a>
                <a href="#" aria-label="Instagram"><Instagram style={{ width: 16, height: 16 }} /></a>
                <a href="#" aria-label="YouTube"><Youtube style={{ width: 16, height: 16 }} /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin style={{ width: 16, height: 16 }} /></a>
              </div>
            </div>
            <div className="foot-col reveal-up in" style={{ transitionDelay: ".1s" }}>
              <div className="h">Expo</div>
              <Link href="/2026-aiae-expo">2026 Expo page</Link>
              <Link href="/visitor-registration">Register Now</Link>
              <Link href="/#gallery">Gallery</Link>
            </div>
            <div className="foot-col reveal-up in" style={{ transitionDelay: ".2s" }}>
              <div className="h">Partners</div>
              <a href="https://kilimo.go.ke" target="_blank" rel="noopener noreferrer">Ministry of Agriculture</a>
              <a href="https://hxie.com" target="_blank" rel="noopener noreferrer">HXIE</a>
            </div>
          </div>
          <div className="contact reveal-up in" style={{ transitionDelay: ".12s" }}>
            <div className="item"><Phone style={{ width: 16, height: 16 }} /> +254 790 888333</div>
            <div className="item"><Mail style={{ width: 16, height: 16 }} /> expo@agriexpo.africa</div>
            <div className="item"><MapPin style={{ width: 16, height: 16 }} /> Arbor House, Aboretum Drive, Nairobi, Kenya</div>
          </div>
          <div className="legal reveal-up in" style={{ transitionDelay: ".22s" }}>
            <span>© 2026 Agri Africa Limited. All rights reserved.</span>
            <span>Nairobi, Kenya · www.agriexpo.africa</span>
          </div>
        </div>
      </footer>
    </>
  );
}
