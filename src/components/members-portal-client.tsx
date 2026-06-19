"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { useState } from "react";
import { PageBodyClass } from "@/src/components/page-body-class";

export function MembersPortalClient({ company }: { company?: string }) {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const isSubmitted = submittedEmail.length > 0;

  return (
    <>
      <PageBodyClass className="portal-page" />

      <header className="portal-nav">
        <Link href="/" aria-label="Agri Africa home">
          <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
        </Link>
        <Link className="portal-back" href="/2026-aiae-expo">
          <ArrowLeft /> Back to Expo
        </Link>
      </header>

      <main className="portal-main">
        <section className="portal-intro">
          <div className="eyebrow">Agri Africa Network</div>
          <h1>Continue the conversation.</h1>
          <p>
            Sign in to connect with exhibitors, manage enquiries, access brochures, and follow up
            on opportunities from 2026 - AIAE.
          </p>
          {company ? (
            <div className="portal-company" id="portal-company">
              <span>Connecting with</span>
              <strong id="portal-company-name">{company}</strong>
            </div>
          ) : null}
        </section>

        <section className="portal-login" aria-labelledby="login-title">
          <div className="eyebrow">Members Portal</div>
          <h2 id="login-title">Sign in with email</h2>
          <p>Enter your registered email and we will send you a secure sign-in link.</p>
          <form
            id="portal-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedEmail(email);
            }}
          >
            <label>
              Email address
              <input
                id="portal-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="name@company.com"
                value={email}
                readOnly={isSubmitted}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button className="btn btn-accent lg block" id="portal-submit" type="submit" disabled={isSubmitted}>
              {isSubmitted ? (
                <>
                  Link sent <Check />
                </>
              ) : (
                <>
                  Send login link <Mail />
                </>
              )}
            </button>
            {isSubmitted ? (
              <div className="portal-message" id="portal-message" role="status" aria-live="polite">
                <strong>Check your inbox</strong>
                <span>
                  We sent a secure sign-in link to <b id="portal-message-email">{submittedEmail}</b>.
                </span>
              </div>
            ) : null}
          </form>
          <div className="portal-request">
            Not a member?{" "}
            <a href="mailto:expo@agriexpo.africa?subject=Agri%20Africa%20membership%20request">
              Request access
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
