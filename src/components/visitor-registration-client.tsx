"use client";

import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  LockKeyhole,
  MailCheck,
  MapPin,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageBodyClass } from "@/src/components/page-body-class";
import { PagePreloader } from "@/src/components/page-preloader";
import {
  sanitizeRegistrationInput,
  type PendingRegistration,
} from "@/src/lib/registration";
import type { ExpoCmsSnapshot } from "@/src/lib/expo-cms";
import type { HomepageSnapshot } from "@/src/lib/homepage-cms";

type RegistrationStep = "form" | "verification" | "complete";
type SubmitState = "idle" | "submitting" | "error";

export function VisitorRegistrationClient({
  expoPage,
  registration,
}: {
  expoPage: Pick<ExpoCmsSnapshot["expoPage"], "dates" | "venue">;
  registration: Pick<HomepageSnapshot, "eventName">;
}) {
  const [step, setStep] = useState<RegistrationStep>("form");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [resendState, setResendState] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [resendAvailableIn, setResendAvailableIn] = useState(0);
  const verificationRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === "verification") {
      verificationRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (resendAvailableIn <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setResendAvailableIn((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendAvailableIn]);

  const bodyClassName =
    step === "verification"
      ? "visitor-register-page is-verifying"
      : step === "complete"
        ? "visitor-register-page is-complete"
        : "visitor-register-page";

  return (
    <>
      <PageBodyClass className={bodyClassName} />
      <PagePreloader bodyClassName={bodyClassName} />

      <header className="register-nav">
        <Link href="/" aria-label="Agri Africa home">
          <img src="/assets/logo-wordmark-dark.svg" alt="Agri Africa" />
        </Link>
        <div className="register-nav-actions">
          <span>Already registered?</span>
          <Link href="/members-portal">
            Members portal <ArrowUpRight />
          </Link>
          <Link href="/admin">
            Admin check-in <ArrowUpRight />
          </Link>
        </div>
      </header>

      <main className="register-shell">
        <aside className="register-event">
          <Link className="register-back" href="/2026-aiae-expo">
            <ArrowLeft /> Back to the Expo
          </Link>
          <div className="register-event-copy">
            <div className="eyebrow">Visitor Registration · {registration.eventName}</div>
            <h1>Meet people moving African agriculture forward.</h1>
            <p>
              Register to explore innovations, meet suppliers, join expert sessions, and build
              valuable connections across the continent&apos;s agricultural value chains.
            </p>
          </div>
          <div className="register-event-details">
            <div>
              <CalendarDays />
              <span>
                <small>Dates</small>
                <strong>{expoPage.dates}</strong>
              </span>
            </div>
            <div>
              <MapPin />
              <span>
                <small>Venue</small>
                <strong>{expoPage.venue}</strong>
              </span>
            </div>
          </div>
          <div className="register-benefits">
            <span>
              <BadgeCheck /> Explore 200+ exhibitors
            </span>
            <span>
              <BadgeCheck /> Access conference sessions
            </span>
            <span>
              <BadgeCheck /> Join curated B2B networking
            </span>
          </div>
        </aside>

        <section className="register-card" aria-labelledby="register-title">
          {step === "form" ? (
            <>
              <div className="register-card-head">
                <div>
                  <div className="eyebrow">Secure your place</div>
                  <h2 id="register-title">Visitor registration</h2>
                </div>
                <span className="register-free">Free registration</span>
              </div>

              <form
                id="visitor-register-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const nextRegistration = sanitizeRegistrationInput({
                    gender: String(formData.get("gender") ?? ""),
                    firstName: String(formData.get("firstName") ?? "").trim(),
                    lastName: String(formData.get("lastName") ?? "").trim(),
                    countryCode: String(formData.get("countryCode") ?? ""),
                    phone: String(formData.get("phone") ?? "").trim(),
                    email: String(formData.get("email") ?? "").trim().toLowerCase(),
                    country: String(formData.get("country") ?? ""),
                    city: String(formData.get("city") ?? "").trim(),
                    company: String(formData.get("company") ?? "").trim(),
                    jobTitle: String(formData.get("jobTitle") ?? "").trim(),
                    consent: formData.get("consent") === "on",
                  });

                  setPendingRegistration(nextRegistration);
                  setEmail(nextRegistration.email);
                  setSubmitError("");
                  setSubmitState("submitting");

                  try {
                    const response = await fetch("/api/registration/request-otp", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(nextRegistration),
                    });

                    const result = (await response.json()) as {
                      ok: boolean;
                      error?: string;
                      resendInSeconds?: number;
                    };

                    if (!response.ok || !result.ok) {
                      throw new Error(result.error ?? "Unable to send verification code.");
                    }

                    setResendAvailableIn(result.resendInSeconds ?? 60);
                    setSubmitState("idle");
                    setStep("verification");
                  } catch (error) {
                    setSubmitState("error");
                    setSubmitError(
                      error instanceof Error
                        ? error.message
                        : "We couldn't send your verification code right now.",
                    );
                  }
                }}
              >
                <div className="register-section">
                  <div className="register-section-title">
                    <span>01</span> Personal information
                  </div>
                  <div className="register-fields two-col">
                    <label className="field-full">
                      Gender <span className="required-mark">*</span>
                      <select name="gender" required defaultValue="">
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Rather not say</option>
                      </select>
                    </label>
                    <label>
                      First name <span className="required-mark">*</span>
                      <input name="firstName" required autoComplete="given-name" placeholder="First name" />
                    </label>
                    <label>
                      Last name <span className="required-mark">*</span>
                      <input name="lastName" required autoComplete="family-name" placeholder="Last name" />
                    </label>
                  </div>
                </div>

                <div className="register-section">
                  <div className="register-section-title">
                    <span>02</span> Contact &amp; verification
                  </div>
                  <div className="register-fields two-col">
                    <label>
                      Mobile number <span className="required-mark">*</span>
                      <span className="phone-field">
                        <select name="countryCode" required aria-label="Country code" defaultValue="+254">
                          <option value="+254">+254</option>
                          <option value="+256">+256</option>
                          <option value="+255">+255</option>
                          <option value="+250">+250</option>
                          <option value="+251">+251</option>
                          <option value="+27">+27</option>
                          <option value="+234">+234</option>
                          <option value="+233">+233</option>
                          <option value="+86">+86</option>
                          <option value="+91">+91</option>
                        </select>
                        <input
                          name="phone"
                          type="tel"
                          required
                          autoComplete="tel-national"
                          placeholder="700 000 000"
                        />
                      </span>
                    </label>
                    <label>
                      Email address <span className="required-mark">*</span>
                      <input
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="name@company.com"
                      />
                    </label>
                  </div>
                </div>

                <div className="register-section">
                  <div className="register-section-title">
                    <span>03</span> Location
                  </div>
                  <div className="register-fields two-col">
                    <label>
                      Country <span className="required-mark">*</span>
                      <select name="country" required defaultValue="">
                        <option value="">Select country</option>
                        <option>Kenya</option>
                        <option>Uganda</option>
                        <option>Tanzania</option>
                        <option>Rwanda</option>
                        <option>Ethiopia</option>
                        <option>South Africa</option>
                        <option>Nigeria</option>
                        <option>Ghana</option>
                        <option>China</option>
                        <option>India</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label>
                      City <span className="required-mark">*</span>
                      <input name="city" required autoComplete="address-level2" placeholder="City" />
                    </label>
                  </div>
                </div>

                <details className="register-extra">
                  <summary>
                    <span>
                      <strong>Professional information</strong>
                      <small>Optional</small>
                    </span>
                    <Plus />
                  </summary>
                  <div className="register-extra-content">
                    <div className="register-section">
                      <div className="register-fields two-col">
                        <label>
                          Company / organisation <span className="optional-mark">Optional</span>
                          <input name="company" autoComplete="organization" placeholder="Organisation name" />
                        </label>
                        <label>
                          Position / title <span className="optional-mark">Optional</span>
                          <input name="jobTitle" autoComplete="organization-title" placeholder="Your role" />
                        </label>
                      </div>
                    </div>
                  </div>
                </details>

                <label className="register-consent">
                  <input type="checkbox" name="consent" required />
                  <span>
                    By submitting this form, you agree to Agri Africa&apos;s Privacy Policy and Terms
                    and Conditions, and consent to receiving communications, updates,
                    opportunities, and invitations related to the purpose for which your
                    information is being collected. <span className="required-mark">*</span>
                  </span>
                </label>
                <button className="btn btn-accent lg block register-submit" type="submit">
                  {submitState === "submitting" ? "Sending verification code..." : "Complete registration"}{" "}
                  <ArrowRight />
                </button>
                {submitError ? <p className="register-submit-error">{submitError}</p> : null}
                <p className="register-privacy">
                  <LockKeyhole /> Your information is securely handled by Agri Africa.
                </p>
              </form>
            </>
          ) : null}

          {step === "verification" ? (
            <form
              className="register-verification"
              id="register-verification"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!pendingRegistration) {
                  setSubmitState("error");
                  setSubmitError("Your registration details are missing. Please complete the form again.");
                  setStep("form");
                  return;
                }

                const formData = new FormData(event.currentTarget);
                const verificationCode = String(formData.get("verificationCode") ?? "").trim();

                setSubmitState("submitting");
                setSubmitError("");

                try {
                  const result = await signIn("attendee-otp", {
                    email: pendingRegistration.email,
                    otp: verificationCode,
                    redirect: false,
                  });

                  if (!result?.ok) {
                    throw new Error("The code is invalid, expired, or already used.");
                  }

                  const session = await getSession();
                  setReference(session?.user?.registrationReference ?? "");
                  setSubmitState("idle");
                  setStep("complete");
                } catch {
                  setSubmitState("error");
                  setSubmitError(
                    "We couldn't complete your registration right now. Please try again in a moment.",
                  );
                }
              }}
            >
              <div className="register-success-icon">
                <MailCheck />
              </div>
              <div className="eyebrow">One final step</div>
              <h2>Verify your email</h2>
              <p>
                We sent a one-time password to <strong id="verification-email">{email}</strong>.
                Enter it below to confirm your registration.
              </p>
              <label className="verification-code">
                <span>One-time password</span>
                <input
                  ref={verificationRef}
                  name="verificationCode"
                  inputMode="numeric"
                  pattern="[0-9]{4,6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  placeholder="Enter 4–6 digit code"
                />
              </label>
              <button className="btn btn-accent lg block register-submit" type="submit">
                {submitState === "submitting"
                  ? "Completing registration..."
                  : "Verify & complete registration"}{" "}
                <ArrowRight />
              </button>
              {submitError ? <p className="register-submit-error">{submitError}</p> : null}
              <button
                className={`verification-resend${resendState ? " is-sent" : ""}`}
                id="resend-otp"
                type="button"
                disabled={!pendingRegistration || resendAvailableIn > 0 || submitState === "submitting"}
                onClick={async () => {
                  if (!pendingRegistration) return;

                  try {
                    const response = await fetch("/api/registration/request-otp", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(pendingRegistration),
                    });
                    const result = (await response.json()) as {
                      ok: boolean;
                      error?: string;
                      resendInSeconds?: number;
                    };

                    if (!response.ok || !result.ok) {
                      throw new Error(result.error ?? "Unable to resend code.");
                    }

                    setResendAvailableIn(result.resendInSeconds ?? 60);
                    setResendState(true);
                    setSubmitError("");
                    window.setTimeout(() => setResendState(false), 2500);
                  } catch (error) {
                    setSubmitError(
                      error instanceof Error ? error.message : "We couldn't resend your code right now.",
                    );
                  }
                }}
              >
                {resendState
                  ? "Code resent"
                  : resendAvailableIn > 0
                    ? `Resend in ${resendAvailableIn}s`
                    : "Resend code"}
              </button>
            </form>
          ) : null}

          {step === "complete" ? (
            <div className="register-success" id="register-success">
              <div className="register-success-icon">
                <BadgeCheck />
              </div>
              <div className="eyebrow">Registration complete</div>
              <h2>You&apos;re on the guest list.</h2>
              <p>
                Your visitor confirmation has been prepared for <strong id="register-email">{email}</strong>.
                Event updates and entry details will be sent closer to 2026 - AIAE.
              </p>
              <div className="register-reference">
                <span>Registration reference</span>
                <strong id="register-reference">{reference}</strong>
              </div>
              <div className="register-success-actions">
                <Link className="btn btn-accent" href="/2026-aiae-expo">
                  Explore the Expo
                </Link>
                <Link className="btn btn-ghost" href="/">
                  Return home
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
