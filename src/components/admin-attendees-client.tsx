"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
} from "lucide-react";
import { type ChangeEvent, useDeferredValue, useEffect, useRef, useState } from "react";
import { PageBodyClass } from "@/src/components/page-body-class";
import type { AttendeeListResult, AttendeeRecord } from "@/src/lib/server/strapi-admin";

type AttendanceStatus = AttendeeRecord["attendanceStatus"];
type AlertState = {
  type: "success" | "error" | "info";
  message: string;
};
type PendingAction = `${string}:save` | "scan" | "refresh" | "login" | null;

function statusLabel(status: AttendanceStatus) {
  if (status === "confirmed") return "Confirmed";
  if (status === "registered") return "Registered";
  return "Pending";
}

function attendeeName(attendee: AttendeeRecord) {
  return `${attendee.firstName} ${attendee.lastName}`.trim();
}

export function AdminAttendeesClient({
  initialAttendees,
  initialPagination,
  initialSearch,
  isAuthenticated,
  adminName,
  initialError,
}: {
  initialAttendees: AttendeeRecord[];
  initialPagination: AttendeeListResult["pagination"];
  initialSearch: string;
  isAuthenticated: boolean;
  adminName: string;
  initialError: string;
}) {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [pagination, setPagination] = useState(initialPagination);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [scanNotes, setScanNotes] = useState("");
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [alert, setAlert] = useState<AlertState | null>(
    initialError ? { type: "error", message: initialError } : null,
  );
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialAttendees.map((attendee) => [attendee.documentId, attendee.notes ?? ""])),
  );
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const deferredSearch = useDeferredValue(searchInput);
  const hasMountedRef = useRef(false);
  const requestSequenceRef = useRef(0);
  const scanAutoSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanBurstRef = useRef({
    count: 0,
    lastAt: 0,
  });

  useEffect(() => {
    return () => {
      if (scanAutoSubmitTimeoutRef.current) {
        clearTimeout(scanAutoSubmitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setAttendees(initialAttendees);
    setPagination(initialPagination);
    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setNotesDrafts(
      Object.fromEntries(initialAttendees.map((attendee) => [attendee.documentId, attendee.notes ?? ""])),
    );
    setAlert(initialError ? { type: "error", message: initialError } : null);
  }, [initialAttendees, initialPagination, initialSearch, initialError]);

  useEffect(() => {
    const normalizedSearch = deferredSearch.trim();

    if (normalizedSearch === search) {
      return;
    }

    setSearch(normalizedSearch);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }, [deferredSearch, search]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    void fetchAttendees(1, search, true).catch((error) => {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load attendees.",
      });
    });
  }, [isAuthenticated, search]);

  async function fetchAttendees(page: number, query: string, showLoader = true) {
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

    if (showLoader) {
      setIsTableLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }

      const response = await fetch(`/api/admin/attendees?${params.toString()}`, {
        cache: "no-store",
      });

      const result = (await response.json()) as {
        ok: boolean;
        attendees?: AttendeeRecord[];
        pagination?: AttendeeListResult["pagination"];
        search?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.attendees || !result.pagination) {
        throw new Error(result.error ?? "Unable to load attendees.");
      }

      if (requestSequenceRef.current !== requestId) {
        return;
      }

      setAttendees(result.attendees);
      setPagination(result.pagination);
      setSearch(result.search ?? query.trim());
      setNotesDrafts(
        Object.fromEntries(result.attendees.map((attendee) => [attendee.documentId, attendee.notes ?? ""])),
      );
    } finally {
      if (requestSequenceRef.current === requestId) {
        setIsTableLoading(false);
      }
    }
  }

  async function refreshAttendees() {
    setAlert({
      type: "info",
      message: "Refreshing attendee records from Strapi...",
    });
    setPendingAction("refresh");

    try {
      await fetchAttendees(1, search, true);
      setAlert({
        type: "success",
        message: "Attendee list refreshed successfully.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to refresh attendees.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleStatusUpdate(documentId: string) {
    const actionKey: PendingAction = `${documentId}:save`;
    setPendingAction(actionKey);
    setAlert(null);

    try {
      const response = await fetch("/api/admin/attendees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          notes: notesDrafts[documentId] ?? "",
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        attendee?: AttendeeRecord;
        error?: string;
        warning?: string;
      };

      if (!response.ok || !result.ok || !result.attendee) {
        throw new Error(result.error ?? "Unable to update attendee.");
      }

      const updatedAttendee = result.attendee;
      const name = attendeeName(updatedAttendee);

      setAttendees((current) =>
        current.map((attendee) => (attendee.documentId === documentId ? updatedAttendee : attendee)),
      );
      setNotesDrafts((current) => ({
        ...current,
        [documentId]: updatedAttendee.notes ?? "",
      }));
      setAlert({
        type: result.warning ? "info" : "success",
        message: result.warning
          ? `Notes saved for ${name}. ${result.warning}`
          : `Notes saved for ${name}.`,
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update attendee.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleScanConfirm() {
    setPendingAction("scan");
    setAlert({
      type: "info",
      message: "Looking up attendee and confirming check-in...",
    });

    try {
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
        warning?: string;
      };

      if (!response.ok || !result.ok || !result.attendee) {
        throw new Error(result.error ?? "Unable to confirm attendee.");
      }

      const confirmedAttendee = result.attendee;
      const name = attendeeName(confirmedAttendee);

      setAttendees((current) =>
        current.map((attendee) =>
          attendee.documentId === confirmedAttendee.documentId ? confirmedAttendee : attendee,
        ),
      );
      setNotesDrafts((current) => ({
        ...current,
        [confirmedAttendee.documentId]: confirmedAttendee.notes ?? "",
      }));
      setAlert({
        type: result.warning ? "info" : "success",
        message: result.warning ? `${name} was confirmed successfully. ${result.warning}` : `${name} was confirmed successfully.`,
      });
      setScanValue("");
      setScanNotes("");
      await fetchAttendees(1, search, false);
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to confirm attendee.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  function scheduleAutomaticScanSubmit(nextValue: string) {
    if (scanAutoSubmitTimeoutRef.current) {
      clearTimeout(scanAutoSubmitTimeoutRef.current);
    }

    scanAutoSubmitTimeoutRef.current = setTimeout(() => {
      if (pendingAction || !nextValue.trim()) {
        return;
      }

      setScanValue(nextValue);
      void handleScanConfirm();
    }, 120);
  }

  function handleScanValueChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value.toUpperCase();
    const inputEvent = event.nativeEvent as InputEvent;
    const inputType = inputEvent.inputType ?? "";
    const now = Date.now();
    const isPaste = inputType === "insertFromPaste";
    const insertedCharacterCount = (inputEvent.data ?? "").length;
    const isRapidCharacterEntry =
      inputType === "insertText" &&
      insertedCharacterCount === 1 &&
      nextValue.length > scanValue.length &&
      now - scanBurstRef.current.lastAt < 45;

    setScanValue(nextValue);

    if (isPaste || pendingAction) {
      scanBurstRef.current = {
        count: 0,
        lastAt: now,
      };
      if (scanAutoSubmitTimeoutRef.current) {
        clearTimeout(scanAutoSubmitTimeoutRef.current);
      }
      return;
    }

    scanBurstRef.current = {
      count: isRapidCharacterEntry ? scanBurstRef.current.count + 1 : 1,
      lastAt: now,
    };

    if (scanBurstRef.current.count >= 6) {
      scheduleAutomaticScanSubmit(nextValue);
    } else if (scanAutoSubmitTimeoutRef.current) {
      clearTimeout(scanAutoSubmitTimeoutRef.current);
    }
  }

  const isRefreshing = pendingAction === "refresh";
  const isScanning = pendingAction === "scan";
  const isSigningIn = pendingAction === "login";

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
            <p>Sign in with your email and password to manage attendee confirmations.</p>

            <form
              className="admin-auth-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setLoginError("");
                setPendingAction("login");
                try {
                  const result = await signIn("strapi-admin", {
                    identifier,
                    password,
                    redirect: false,
                  });

                  if (result?.error) {
                    setLoginError("Login failed. Check your Strapi admin email and password.");
                    return;
                  }

                  window.location.href = "/admin";
                } catch {
                  setLoginError("Login failed. Check your Strapi admin email and password.");
                } finally {
                  setPendingAction(null);
                }
              }}
            >
              <label>
                Admin email
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="admin@example.com"
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
                  <AlertCircle />
                  <span>{loginError}</span>
                </div>
              ) : null}
              <button className="btn btn-accent lg block" type="submit" disabled={isSigningIn}>
                {isSigningIn ? <LoaderCircle className="spin" /> : <ShieldCheck />}
                {isSigningIn ? "Signing in..." : "Sign in"}
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
          <button className="btn btn-secondary" type="button" disabled={isRefreshing} onClick={() => void refreshAttendees()}>
            {isRefreshing ? <LoaderCircle className="spin" /> : <RefreshCw />}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn btn-light" type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
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
            Type in or scan the registration reference and we
            will mark the attendee as confirmed.
          </p>
          <form
            className="admin-scan-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleScanConfirm();
            }}
          >
            <label>
              Registration reference
              <input
                value={scanValue}
                onChange={handleScanValueChange}
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
            {scanValue.trim() ? (
              <button className="btn btn-accent" type="submit" disabled={isScanning}>
                {isScanning ? <LoaderCircle className="spin" /> : <CheckCircle2 />}
                {isScanning ? "Confirming..." : "Confirm attendee"}
              </button>
            ) : null}
          </form>
          {alert ? (
            <div className={`admin-inline-message is-${alert.type}`} role={alert.type === "error" ? "alert" : "status"}>
              {alert.type === "error" ? <AlertCircle /> : alert.type === "success" ? <CheckCircle2 /> : <LoaderCircle className="spin" />}
              <span>{alert.message}</span>
            </div>
          ) : null}
        </section>

        <section className="admin-table-card">
          <div className="admin-card-head admin-table-toolbar">
            <div>
              <div className="eyebrow">Attendees</div>
              <h2>{pagination.total} records</h2>
            </div>
            <label className="admin-search-field">
              <Search />
              <input
                className="admin-search-input"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, email, company"
              />
            </label>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-attendees-table">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((attendee) => {
                  const saveActionKey: PendingAction = `${attendee.documentId}:save`;
                  const isSaving = pendingAction === saveActionKey;

                  return (
                    <tr key={attendee.documentId}>
                      <td data-label="Attendee">
                        <strong>{attendeeName(attendee)}</strong>
                        <span>{attendee.email}</span>
                        <span>{attendee.company || attendee.phone}</span>
                      </td>
                      <td data-label="Status">
                        <span className={`admin-status-pill is-${attendee.attendanceStatus}`}>
                          {statusLabel(attendee.attendanceStatus)}
                        </span>
                        {attendee.checkedInAt ? <small>{new Date(attendee.checkedInAt).toLocaleString()}</small> : null}
                      </td>
                      <td data-label="Notes">
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
                      <td data-label="Action">
                        <div className="admin-row-actions">
                          <button
                            className="btn btn-light sm"
                            type="button"
                            disabled={isSaving || isTableLoading}
                            onClick={() => void handleStatusUpdate(attendee.documentId)}
                          >
                            {isSaving ? <LoaderCircle className="spin" /> : null}
                            {isSaving ? "Saving..." : "Save notes"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isTableLoading && attendees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-empty-cell">
                      {search
                        ? "No attendees matched that search. Try a name, email, or company."
                        : "No attendees found yet."}
                    </td>
                  </tr>
                ) : null}
                {isTableLoading ? (
                  <tr>
                    <td colSpan={4} className="admin-empty-cell">
                      <div className="admin-loading-state">
                        <LoaderCircle className="spin" />
                        <span>Loading attendees from Strapi...</span>
                      </div>
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
