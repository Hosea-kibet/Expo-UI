"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { ArrowLeft, CheckCircle2, LogOut, RefreshCw, ScanLine, ShieldCheck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { PageBodyClass } from "@/src/components/page-body-class";
import type { AttendeeRecord } from "@/src/lib/server/strapi-admin";

type AttendanceStatus = AttendeeRecord["attendanceStatus"];

function statusLabel(status: AttendanceStatus) {
  if (status === "confirmed") return "Confirmed";
  if (status === "registered") return "Registered";
  return "Pending";
}

export function AdminAttendeesClient({
  initialAttendees,
  isAuthenticated,
  adminName,
  initialError,
}: {
  initialAttendees: AttendeeRecord[];
  isAuthenticated: boolean;
  adminName: string;
  initialError: string;
}) {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [scanNotes, setScanNotes] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(initialError);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialAttendees.map((attendee) => [attendee.documentId, attendee.notes ?? ""])),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAttendees(initialAttendees);
    setNotesDrafts(
      Object.fromEntries(initialAttendees.map((attendee) => [attendee.documentId, attendee.notes ?? ""])),
    );
  }, [initialAttendees]);

  async function refreshAttendees() {
    const response = await fetch("/api/admin/attendees", { cache: "no-store" });
    const result = (await response.json()) as {
      ok: boolean;
      attendees?: AttendeeRecord[];
      error?: string;
    };

    if (!response.ok || !result.ok || !result.attendees) {
      throw new Error(result.error ?? "Unable to refresh attendees.");
    }

    setAttendees(result.attendees);
    setNotesDrafts(
      Object.fromEntries(result.attendees.map((attendee) => [attendee.documentId, attendee.notes ?? ""])),
    );
  }

  async function handleStatusUpdate(documentId: string, attendanceStatus: AttendanceStatus) {
    setMessage("");

    const response = await fetch("/api/admin/attendees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        attendanceStatus,
        notes: notesDrafts[documentId] ?? "",
      }),
    });

    const result = (await response.json()) as {
      ok: boolean;
      attendee?: AttendeeRecord;
      error?: string;
    };

    if (!response.ok || !result.ok || !result.attendee) {
      throw new Error(result.error ?? "Unable to update attendee.");
    }

    const updatedAttendee = result.attendee;

    setAttendees((current) =>
      current.map((attendee) => (attendee.documentId === documentId ? updatedAttendee : attendee)),
    );
    setNotesDrafts((current) => ({
      ...current,
      [documentId]: updatedAttendee.notes ?? "",
    }));
    setMessage(`${updatedAttendee.firstName} ${updatedAttendee.lastName} updated.`);
  }

  async function handleScanConfirm() {
    setMessage("");

    const response = await fetch("/api/admin/attendees/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationReference: scanValue,
        notes: scanNotes,
      }),
    });

    const result = (await response.json()) as {
      ok: boolean;
      attendee?: AttendeeRecord;
      error?: string;
    };

    if (!response.ok || !result.ok || !result.attendee) {
      throw new Error(result.error ?? "Unable to confirm attendee.");
    }

    const confirmedAttendee = result.attendee;

    setAttendees((current) => {
      const existing = current.find((attendee) => attendee.documentId === confirmedAttendee.documentId);

      if (!existing) {
        return [confirmedAttendee, ...current];
      }

      return current.map((attendee) =>
        attendee.documentId === confirmedAttendee.documentId ? confirmedAttendee : attendee,
      );
    });
    setNotesDrafts((current) => ({
      ...current,
      [confirmedAttendee.documentId]: confirmedAttendee.notes ?? "",
    }));
    setMessage(`${confirmedAttendee.firstName} ${confirmedAttendee.lastName} confirmed at check-in.`);
    setScanValue("");
    setScanNotes("");
  }

  const filteredAttendees = attendees.filter((attendee) => {
    const haystack = [
      attendee.firstName,
      attendee.lastName,
      attendee.email,
      attendee.registrationReference,
      attendee.company ?? "",
      attendee.notes ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search.trim().toLowerCase());
  });

  if (!isAuthenticated) {
    return (
      <>
        <PageBodyClass className="admin-attendees-page" />
        <main className="admin-auth-shell">
          <section className="admin-auth-card">
            <Link className="admin-back-link" href="/2026-aiae-expo">
              <ArrowLeft /> Back to Expo
            </Link>
            <div className="eyebrow">Admin Access</div>
            <h1>Attendee check-in</h1>
            <p>Sign in with your  username or email and password to manage attendee confirmations.</p>

            <form
              className="admin-auth-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setLoginError("");

                const result = await signIn("strapi-admin", {
                  identifier,
                  password,
                  redirect: false,
                });

                if (result?.error) {
                  setLoginError("Login failed. Check your Strapi credentials and permissions.");
                  return;
                }

                window.location.reload();
              }}
            >
              <label>
                Username or email
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="admin"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </label>
              {loginError ? (
                <div className="admin-inline-message is-error" role="alert">
                  {loginError}
                </div>
              ) : null}
              <button className="btn btn-accent lg block" type="submit">
                <ShieldCheck /> Sign in
              </button>
            </form>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <PageBodyClass className="admin-attendees-page" />

      <header className="admin-attendees-header">
        <div>
          <div className="eyebrow">Event Admin</div>
          <h1>Attendee status tracker</h1>
          <p>{adminName ? `Signed in as ${adminName}.` : "Manage attendee confirmations and notes."}</p>
        </div>
        <div className="admin-attendees-actions">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await refreshAttendees();
                  setMessage("Attendee list refreshed.");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Unable to refresh attendees.");
                }
              })
            }
          >
            <RefreshCw /> Refresh
          </button>
          <button className="btn btn-light" type="button" onClick={() => signOut({ callbackUrl: "/admin" })}>
            <LogOut /> Sign out
          </button>
        </div>
      </header>

      <main className="admin-attendees-shell">
        <section className="admin-scan-card">
          <div className="admin-card-head">
            <div>
              <div className="eyebrow">Check-in</div>
              <h2>Scan or paste QR reference</h2>
            </div>
            <ScanLine />
          </div>
          <p>
            Most USB QR scanners type directly into the focused field. Paste or scan the registration reference and we
            will mark the attendee as confirmed.
          </p>
          <form
            className="admin-scan-form"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                try {
                  await handleScanConfirm();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Unable to confirm attendee.");
                }
              });
            }}
          >
            <label>
              Registration reference
              <input
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value.toUpperCase())}
                placeholder="AIAE26-ABC123"
                required
              />
            </label>
            <label>
              Notes
              <input
                value={scanNotes}
                onChange={(event) => setScanNotes(event.target.value)}
                placeholder="VIP guest, arrived with team, etc."
              />
            </label>
            <button className="btn btn-accent" type="submit" disabled={isPending}>
              <CheckCircle2 /> Confirm attendee
            </button>
          </form>
          {message ? (
            <div className="admin-inline-message" role="status">
              {message}
            </div>
          ) : null}
        </section>

        <section className="admin-table-card">
          <div className="admin-card-head">
            <div>
              <div className="eyebrow">Attendees</div>
              <h2>{filteredAttendees.length} records</h2>
            </div>
            <input
              className="admin-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, reference, company"
            />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-attendees-table">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.documentId}>
                    <td>
                      <strong>{`${attendee.firstName} ${attendee.lastName}`}</strong>
                      <span>{attendee.email}</span>
                      <span>{attendee.company || attendee.phone}</span>
                    </td>
                    <td>{attendee.registrationReference}</td>
                    <td>
                      <span className={`admin-status-pill is-${attendee.attendanceStatus}`}>
                        {statusLabel(attendee.attendanceStatus)}
                      </span>
                      {attendee.checkedInAt ? <small>{new Date(attendee.checkedInAt).toLocaleString()}</small> : null}
                    </td>
                    <td>
                      <input
                        value={notesDrafts[attendee.documentId] ?? ""}
                        onChange={(event) =>
                          setNotesDrafts((current) => ({
                            ...current,
                            [attendee.documentId]: event.target.value,
                          }))
                        }
                        placeholder="Add notes"
                      />
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="btn btn-light sm"
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              try {
                                await handleStatusUpdate(attendee.documentId, attendee.attendanceStatus);
                              } catch (error) {
                                setMessage(error instanceof Error ? error.message : "Unable to update attendee.");
                              }
                            })
                          }
                        >
                          Save notes
                        </button>
                        <button
                          className="btn btn-accent sm"
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              try {
                                await handleStatusUpdate(attendee.documentId, "confirmed");
                              } catch (error) {
                                setMessage(error instanceof Error ? error.message : "Unable to update attendee.");
                              }
                            })
                          }
                        >
                          Confirm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty-cell">
                      No attendees matched your search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
