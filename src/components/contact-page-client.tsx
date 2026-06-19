"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { PageBodyClass } from "@/src/components/page-body-class";
import { PagePreloader } from "@/src/components/page-preloader";

export function ContactPageClient() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <>
      <PageBodyClass className="contact-page" />
      <PagePreloader bodyClassName="contact-page" />

      <header className="contact-nav">
        <Link href="/" aria-label="Agri Africa home">
          <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
        </Link>
        <Link className="contact-back" href="/">
          <ArrowLeft /> Back home
        </Link>
      </header>

      <main className="contact-shell">
        <section className="contact-intro">
          <div className="eyebrow">Contact Agri Africa</div>
          <h1>Let&apos;s move agriculture forward.</h1>
          <p>
            Talk to our team about attending, exhibiting, partnerships, media, or anything else
            related to Agri Africa and 2026 - AIAE.
          </p>

          <div className="contact-details-list">
            <a href="mailto:expo@agriexpo.africa">
              <Mail />
              <span>
                <small>Email</small>
                <strong>expo@agriexpo.africa</strong>
              </span>
            </a>
            <a href="tel:+254790888333">
              <Phone />
              <span>
                <small>Phone</small>
                <strong>+254 790 888333</strong>
              </span>
            </a>
            <div>
              <MapPin />
              <span>
                <small>Office</small>
                <strong>Arbor House, Arboretum Drive, Nairobi, Kenya</strong>
              </span>
            </div>
          </div>
        </section>

        <section className="contact-form-card" aria-labelledby="contact-title">
          <div className="eyebrow">Send an enquiry</div>
          <h2 id="contact-title">How can we help?</h2>
          {!isSubmitted ? (
            <form
              id="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
                setIsSubmitted(true);
              }}
            >
              <div className="contact-fields two-col">
                <label>
                  Full name
                  <input name="name" required autoComplete="name" placeholder="Your name" />
                </label>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                  />
                </label>
              </div>
              <label>
                Enquiry type
                <select name="subject" required defaultValue="">
                  <option value="">Select a topic</option>
                  <option>Visitor enquiry</option>
                  <option>Exhibitor enquiry</option>
                  <option>Partnership enquiry</option>
                  <option>Media enquiry</option>
                  <option>General enquiry</option>
                </select>
              </label>
              <label>
                Message
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Tell us how we can help"
                />
              </label>
              <button className="btn btn-accent lg block" type="submit">
                Send enquiry <ArrowRight />
              </button>
            </form>
          ) : (
            <div className="contact-success" id="contact-success" role="status" aria-live="polite">
              <BadgeCheck />
              <div>
                <strong>Message received</strong>
                <span>Thank you. Our team will get back to you shortly.</span>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
