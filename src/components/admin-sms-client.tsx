"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { PageBodyClass } from "@/src/components/page-body-class";
import type { AttendeeRecord } from "@/src/lib/server/strapi-admin";

type AlertState = {
  type: "success" | "error" | "info";
  message: string;
};

type SendMode = "all" | "single";

function attendeeName(attendee: AttendeeRecord) {
  return `${attendee.firstName} ${attendee.lastName}`.trim();
}

export function AdminSmsClient({
  initialAttendees,
  totalAttendees,
  adminName,
  initialError,
}: {
  initialAttendees: AttendeeRecord[];
  totalAttendees: number;
  adminName: string;
  initialError: string;
}) {
  const [mode, setMode] = useState<SendMode>("all");
  const [message, setMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [attendees, setAttendees] = useState(initialAttendees);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState(initialAttendees[0]?.documentId ?? "");
  const [alert, setAlert] = useState<AlertState | null>(
    initialError ? { type: "error", message: initialError } : null,
  );
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const deferredSearch = useDeferredValue(searchInput);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    setAttendees(initialAttendees);
    setSelectedAttendeeId((current) => current || initialAttendees[0]?.documentId || "");
    setAlert(initialError ? { type: "error", message: initialError } : null);
  }, [initialAttendees, initialError]);

  useEffect(() => {
    if (mode !== "single") {
      return;
    }

    const query = deferredSearch.trim();
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    setIsLoadingAttendees(true);

    void fetch(`/api/admin/attendees?page=1&pageSize=20${query ? `&q=${encodeURIComponent(query)}` : ""}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          ok: boolean;
          attendees?: AttendeeRecord[];
          error?: string;
        };

        if (!response.ok || !result.ok || !result.attendees) {
          throw new Error(result.error ?? "Unable to load attendees.");
        }

        if (requestSequenceRef.current !== requestId) {
          return;
        }

        const nextAttendees = result.attendees;

        setAttendees(nextAttendees);
        setSelectedAttendeeId((current) => {
          if (nextAttendees.some((attendee) => attendee.documentId === current)) {
            return current;
          }

          return nextAttendees[0]?.documentId ?? "";
        });
      })
      .catch((error) => {
        if (requestSequenceRef.current !== requestId) {
          return;
        }

        setAlert({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to load attendees.",
        });
      })
      .finally(() => {
        if (requestSequenceRef.current === requestId) {
          setIsLoadingAttendees(false);
        }
      });
  }, [deferredSearch, mode]);

  const selectedAttendee =
    attendees.find((attendee) => attendee.documentId === selectedAttendeeId) ?? null;

  async function handleSend() {
    setIsSending(true);
    setAlert({
      type: "info",
      message: mode === "all" ? "Sending SMS blast to attendees..." : "Sending SMS to selected attendee...",
    });

    try {
      const response = await fetch("/api/admin/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          attendeeDocumentId: mode === "single" ? selectedAttendeeId : undefined,
          message,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        recipientCount?: number;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to send SMS.");
      }

      setAlert({
        type: "success",
        message:
          mode === "all"
            ? `SMS blast sent to ${result.recipientCount ?? 0} attendees.`
            : `SMS sent to ${selectedAttendee ? attendeeName(selectedAttendee) : "the selected attendee"}.`,
      });
      setMessage("");
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to send SMS.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <PageBodyClass className="admin-attendees-page" />

      <header className="admin-attendees-header">
        <div>
          <div className="eyebrow">Event Admin</div>
          <h1>Attendee SMS</h1>
          <p>{adminName ? `Signed in as ${adminName}.` : "Send updates to attendees by SMS."}</p>
        </div>
        <div className="admin-attendees-actions">
          <Link className="btn btn-secondary" href="/admin">
            <ArrowLeft /> Back to attendee admin
          </Link>
          <button className="btn btn-light" type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
            <LogOut /> Sign out
          </button>
        </div>
      </header>

      <main className="admin-attendees-shell">
        <section className="admin-scan-card">
          <div className="admin-card-head">
            <div>
              <div className="eyebrow">SMS Center</div>
              <h2>Compose message</h2>
            </div>
            <MessageSquareText />
          </div>

          <div className="admin-segmented-control" role="tablist" aria-label="SMS recipient mode">
            <button
              className={`admin-segmented-option${mode === "all" ? " is-active" : ""}`}
              type="button"
              onClick={() => setMode("all")}
            >
              <Users />
              <span>Blast all attendees</span>
            </button>
            <button
              className={`admin-segmented-option${mode === "single" ? " is-active" : ""}`}
              type="button"
              onClick={() => setMode("single")}
            >
              <Send />
              <span>Send to one attendee</span>
            </button>
          </div>

          <div className="admin-sms-summary-grid">
            <div className="admin-sms-summary">
              <small>Recipient scope</small>
              <strong>{mode === "all" ? "All attendees" : "One attendee"}</strong>
            </div>
            <div className="admin-sms-summary">
              <small>Available records</small>
              <strong>{totalAttendees}</strong>
            </div>
            <div className="admin-sms-summary">
              <small>Message length</small>
              <strong>{message.trim().length} chars</strong>
            </div>
          </div>

          {mode === "single" ? (
            <div className="admin-sms-pick-card">
              <label className="admin-search-field">
                <Search />
                <input
                  className="admin-search-input"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search attendee by name, email, or company"
                />
              </label>

              <div className="admin-select-wrap">
                <select
                  className="admin-select-input"
                  value={selectedAttendeeId}
                  onChange={(event) => setSelectedAttendeeId(event.target.value)}
                >
                  {attendees.map((attendee) => (
                    <option key={attendee.documentId} value={attendee.documentId}>
                      {attendeeName(attendee)} - {attendee.phone}
                    </option>
                  ))}
                </select>
                {isLoadingAttendees ? <RefreshCw className="spin admin-select-loader" /> : null}
              </div>

              {selectedAttendee ? (
                <div className="admin-selected-attendee">
                  <strong>{attendeeName(selectedAttendee)}</strong>
                  <span>{selectedAttendee.email}</span>
                  <span>{selectedAttendee.company || selectedAttendee.phone}</span>
                </div>
              ) : (
                <div className="admin-empty-inline">No attendee matches the current search.</div>
              )}
            </div>
          ) : null}

          <form
            className="admin-sms-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <label>
              Message
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type the SMS you want attendees to receive."
                rows={6}
                required
              />
            </label>

            <button
              className="btn btn-accent"
              type="submit"
              disabled={isSending || !message.trim() || (mode === "single" && !selectedAttendeeId)}
            >
              {isSending ? <LoaderCircle className="spin" /> : <Send />}
              {isSending ? "Sending..." : mode === "all" ? "Send blast SMS" : "Send attendee SMS"}
            </button>
          </form>

          {alert ? (
            <div className={`admin-inline-message is-${alert.type}`} role={alert.type === "error" ? "alert" : "status"}>
              {alert.type === "error" ? <AlertCircle /> : <LoaderCircle className={alert.type === "info" ? "spin" : ""} />}
              <span>{alert.message}</span>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
