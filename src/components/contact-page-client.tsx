"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageBodyClass } from "@/src/components/page-body-class";
import { PagePreloader } from "@/src/components/page-preloader";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

const ENQUIRY_OPTIONS = [
  "Visitor Enquiry",
  "Exhibitor Enquiry",
  "Partner Enquiry",
  "Media Enquiry",
  "General Enquiry",
] as const;

function getInitialEnquiryType(value: string | null) {
  if (!value) {
    return "";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "partner" || normalized === "partner-enquiry" || normalized === "partnership") {
    return "Partner Enquiry";
  }

  if (normalized === "visitor" || normalized === "visitor-enquiry") {
    return "Visitor Enquiry";
  }

  if (normalized === "exhibitor" || normalized === "exhibitor-enquiry") {
    return "Exhibitor Enquiry";
  }

  if (normalized === "media" || normalized === "media-enquiry") {
    return "Media Enquiry";
  }

  if (normalized === "general" || normalized === "general-enquiry") {
    return "General Enquiry";
  }

  return "";
}

export function ContactPageClient({
  contact,
}: {
  contact: Pick<HomepageSnapshot, "email" | "phone" | "address">;
}) {
  const searchParams = useSearchParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [enquiryType, setEnquiryType] = useState("");

  useEffect(() => {
    setEnquiryType(getInitialEnquiryType(searchParams.get("enquiryType")));
  }, [searchParams]);

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
            <a href={`mailto:${contact.email}`}>
              <Mail />
              <span>
                <small>Email</small>
                <strong>{contact.email}</strong>
              </span>
            </a>
            <a href={`tel:${contact.phone.replace(/\s+/g, "")}`}>
              <Phone />
              <span>
                <small>Phone</small>
                <strong>{contact.phone}</strong>
              </span>
            </a>
            <div>
              <MapPin />
              <span>
                <small>Office</small>
                <strong>{contact.address}</strong>
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
                <select
                  name="subject"
                  required
                  value={enquiryType}
                  onChange={(event) => setEnquiryType(event.target.value)}
                >
                  <option value="">Select a topic</option>
                  {ENQUIRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
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
