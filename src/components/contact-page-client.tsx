"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageBodyClass } from "@/src/components/page-body-class";
import { PagePreloader } from "@/src/components/page-preloader";
import { ENQUIRY_OPTIONS } from "@/src/lib/contact-enquiry";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    "Thank you. Our team will get back to you shortly.",
  );
  const [enquiryType, setEnquiryType] = useState("");

  useEffect(() => {
    setEnquiryType(getInitialEnquiryType(searchParams.get("enquiryType")));
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      enquiryType: String(formData.get("enquiryType") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    try {
      const response = await fetch("/api/contact-enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        notified?: boolean;
        warning?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to submit your enquiry.");
      }

      setSuccessMessage(
        result.warning || "Thank you. Our team will get back to you shortly.",
      );
      setIsSubmitted(true);
      event.currentTarget.reset();
      setEnquiryType(getInitialEnquiryType(searchParams.get("enquiryType")));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not send your enquiry right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
              onSubmit={handleSubmit}
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
                  name="enquiryType"
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
              {errorMessage ? (
                <div className="contact-form-error" role="alert" aria-live="polite">
                  {errorMessage}
                </div>
              ) : null}
              <button className="btn btn-accent lg block" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending enquiry..." : "Send enquiry"} <ArrowRight />
              </button>
            </form>
          ) : (
            <div className="contact-success" id="contact-success" role="status" aria-live="polite">
              <BadgeCheck />
              <div>
                <strong>Message received</strong>
                <span>{successMessage}</span>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
