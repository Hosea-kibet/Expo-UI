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
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageBodyClass } from "@/src/components/page-body-class";
import { AdminPagination } from "@/src/components/admin-pagination";
import type { AttendeeListResult, AttendeeRecord } from "@/src/lib/server/strapi-admin";
import {
  emptyAttendeeMessageFilters,
  hasAttendeeMessageFilters,
  type AttendeeMessageFilters,
} from "@/src/lib/attendee-message-filters";

type AlertState = {
  type: "success" | "error" | "info";
  message: string;
};

type SendMode = "all" | "single";

function attendeeName(attendee: AttendeeRecord) {
  return `${attendee.firstName} ${attendee.lastName}`.trim();
}

export function AdminMessagingClient({
  adminName,
  channel,
}: {
  adminName: string;
  channel: "SMS" | "WhatsApp";
}) {
  const endpoint = channel === "SMS" ? "/api/admin/sms" : "/api/admin/whatsapp";
  const [mode, setMode] = useState<SendMode>("all");
  const [message, setMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [pagination, setPagination] = useState<AttendeeListResult["pagination"]>({
    page: 1, pageSize: 20, pageCount: 1, total: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [reloadRecipients, setReloadRecipients] = useState(0);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [blastFilters, setBlastFilters] = useState<AttendeeMessageFilters>(emptyAttendeeMessageFilters);
  const recipientsReady = !isLoadingAttendees && !recipientError && searchInput.trim() === search;
  const filteredAttendeeCount = pagination.total;
  const hasBlastFilters = hasAttendeeMessageFilters(blastFilters) || !!search;

  function updateBlastFilter<Key extends keyof AttendeeMessageFilters>(
    key: Key,
    value: AttendeeMessageFilters[Key],
  ) {
    setPage(1);
    setBlastFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "country" ? { city: "" } : {}),
    }));
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingAttendees(true);
    setRecipientError("");

    async function loadAttendees() {
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "20" });
        if (search) params.set("q", search);
        if (mode === "all") {
          Object.entries(blastFilters).forEach(([field, value]) => {
            if (value) params.set(field, value);
          });
        }
        const response = await fetch(`/api/admin/attendees?${params}`, {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]),
        });
        const result = (await response.json()) as AttendeeListResult & { ok: boolean; error?: string };
        if (!response.ok || !result.ok || !Array.isArray(result.attendees) || !result.pagination) {
          throw new Error(result.error ?? "Unable to load attendees.");
        }
        if (controller.signal.aborted) return;
        setAttendees(result.attendees);
        setPagination(result.pagination);
        setSelectedAttendeeId((current) =>
          result.attendees.some((attendee) => attendee.documentId === current)
            ? current : result.attendees[0]?.documentId ?? "",
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setAttendees([]);
        setSelectedAttendeeId("");
        setRecipientError(error instanceof Error && error.name !== "TimeoutError"
          ? error.message : "Loading attendees timed out. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoadingAttendees(false);
      }
    }

    void loadAttendees();
    return () => controller.abort();
  }, [page, search, mode, blastFilters, reloadRecipients]);

  const selectedAttendee =
    attendees.find((attendee) => attendee.documentId === selectedAttendeeId) ?? null;

  async function handleSend() {
    if (!recipientsReady || isSending) return;
    setIsSending(true);
    setAlert({
      type: "info",
      message: mode === "all" ? `Sending ${channel} blast to attendees...` : `Sending ${channel} to selected attendee...`,
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          attendeeDocumentId: mode === "single" ? selectedAttendeeId : undefined,
          message,
          filters: mode === "all" ? blastFilters : undefined,
          search: mode === "all" ? search : undefined,
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        recipientCount?: number;
        failedCount?: number;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? `Unable to send ${channel}.`);
      }

      setAlert({
        type: result.failedCount ? "info" : "success",
        message:
          mode === "all"
            ? result.failedCount
              ? `${channel} sent to ${result.recipientCount ?? 0} attendees; ${result.failedCount} deliveries were rejected.`
              : `${channel} blast sent to ${result.recipientCount ?? 0} attendees.`
            : result.failedCount
              ? `${channel} could not be delivered to the selected attendee.`
              : `${channel} sent to ${selectedAttendee ? attendeeName(selectedAttendee) : "the selected attendee"}.`,
      });
      setMessage("");
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : `Unable to send ${channel}.`,
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
          <h1>Attendee {channel}</h1>
          <p>{adminName ? `Signed in as ${adminName}.` : `Send updates to attendees by ${channel}.`}</p>
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
              <div className="eyebrow">{channel} Center</div>
              <h2>Compose message</h2>
            </div>
            <MessageSquareText />
          </div>

          {isLoadingAttendees && !recipientError ? (
            <div className="admin-inline-message is-info" role="status" aria-live="polite">
              <LoaderCircle className="spin" />
              <span>
                Loading attendees...
              </span>
            </div>
          ) : null}
          {recipientError ? (
            <div className="admin-inline-message is-error" role="alert">
              <AlertCircle />
              <span>{recipientError}</span>
              <button className="btn btn-light" type="button" onClick={() => setReloadRecipients((current) => current + 1)}>
                <RefreshCw /> Retry
              </button>
            </div>
          ) : null}

          <div className="admin-segmented-control" role="tablist" aria-label={`${channel} recipient mode`}>
            <button
              className={`admin-segmented-option${mode === "all" ? " is-active" : ""}`}
              type="button"
              onClick={() => { setMode("all"); setPage(1); }}
            >
              <Users />
              <span>Blast all attendees</span>
            </button>
            <button
              className={`admin-segmented-option${mode === "single" ? " is-active" : ""}`}
              type="button"
              onClick={() => { setMode("single"); setPage(1); }}
            >
              <Send />
              <span>Send to one attendee</span>
            </button>
          </div>

          <div className="admin-sms-summary-grid">
            <div className="admin-sms-summary">
              <small>Recipient scope</small>
              <strong>
                {mode === "all"
                  ? hasBlastFilters
                    ? "Filtered attendees"
                    : "All attendees"
                  : "One attendee"}
              </strong>
            </div>
            <div className="admin-sms-summary">
              <small>{mode === "all" ? "Matching recipients" : "Available records"}</small>
              <strong>{recipientsReady ? filteredAttendeeCount : "—"}</strong>
            </div>
            <div className="admin-sms-summary">
              <small>Message length</small>
              <strong>{message.trim().length} chars</strong>
            </div>
          </div>

          {mode === "all" ? (
            <div className="admin-blast-filters">
              <div className="admin-blast-filters-head">
                <div>
                  <strong>Filter blast recipients</strong>
                  <span>Only matching attendees will receive this {channel} message.</span>
                </div>
                {hasBlastFilters ? (
                  <button
                    type="button"
                    onClick={() => { setBlastFilters(emptyAttendeeMessageFilters); setSearchInput(""); setSearch(""); setPage(1); }}
                  >
                    <X /> Clear filters
                  </button>
                ) : null}
              </div>
              <div className="admin-blast-filter-grid">
                <label>
                  Attendance
                  <select
                    value={blastFilters.attendanceStatus}
                    onChange={(event) =>
                      updateBlastFilter(
                        "attendanceStatus",
                        event.target.value as AttendeeMessageFilters["attendanceStatus"],
                      )
                    }
                  >
                    <option value="">All attendance statuses</option>
                    <option value="pending">Pending</option>
                    <option value="registered">Registered</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </label>
                <label>
                  Registration
                  <select
                    value={blastFilters.registrationStatus}
                    onChange={(event) =>
                      updateBlastFilter(
                        "registrationStatus",
                        event.target.value as AttendeeMessageFilters["registrationStatus"],
                      )
                    }
                  >
                    <option value="">All registration statuses</option>
                    <option value="pending-verification">Pending verification</option>
                    <option value="verified">Verified</option>
                  </select>
                </label>
                <label>
                  Country
                  <input
                    type="text"
                    value={blastFilters.country}
                    onChange={(event) => updateBlastFilter("country", event.target.value)}
                    placeholder="All country values"
                  />
                </label>
                <label>
                  City
                  <input
                    type="text"
                    value={blastFilters.city}
                    onChange={(event) => updateBlastFilter("city", event.target.value)}
                    placeholder="All city values"
                  />
                </label>
                <label>
                  Gender
                  <select
                    value={blastFilters.gender}
                    onChange={(event) => updateBlastFilter("gender", event.target.value)}
                  >
                    <option value="">All genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Rather not say">Rather not say</option>
                  </select>
                </label>
                <label>
                  Organisation
                  <input
                    type="text"
                    value={blastFilters.company}
                    onChange={(event) => updateBlastFilter("company", event.target.value)}
                    placeholder="All organisation values"
                  />
                </label>
              </div>
            </div>
          ) : null}

          <div className="admin-sms-pick-card">
            <label className="admin-search-field">
              <Search />
              <input
                className="admin-search-input"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name, email, phone, company or reference"
              />
            </label>
            <div className="admin-table-wrap">
              <table className="admin-attendees-table">
                <thead>
                  <tr><th>Attendee</th><th>Phone</th><th>Company</th>{mode === "single" ? <th>Recipient</th> : null}</tr>
                </thead>
                <tbody>
                  {attendees.map((attendee) => (
                    <tr key={attendee.documentId}>
                      <td data-label="Attendee"><strong>{attendeeName(attendee)}</strong><span>{attendee.email}</span></td>
                      <td data-label="Phone">{attendee.fullPhoneNumber || attendee.phone}</td>
                      <td data-label="Company">{attendee.company || "—"}</td>
                      {mode === "single" ? (
                        <td data-label="Recipient">
                          <button
                            className={`btn ${selectedAttendeeId === attendee.documentId ? "btn-accent" : "btn-light"} sm`}
                            type="button"
                            disabled={!recipientsReady}
                            aria-label={`Select ${attendeeName(attendee)}`}
                            aria-pressed={selectedAttendeeId === attendee.documentId}
                            onClick={() => setSelectedAttendeeId(attendee.documentId)}
                          >
                            {selectedAttendeeId === attendee.documentId ? "Selected" : "Select"}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                  {!isLoadingAttendees && attendees.length === 0 ? (
                    <tr><td colSpan={mode === "single" ? 4 : 3} className="admin-empty-cell">No attendees match this search or these filters.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={page}
              pageSize={20}
              total={pagination.total}
              isLoading={isLoadingAttendees}
              onPageChange={setPage}
            />
            {mode === "single" && selectedAttendee ? (
              <div className="admin-selected-attendee">
                <strong>Selected: {attendeeName(selectedAttendee)}</strong>
                <span>{selectedAttendee.email}</span>
              </div>
            ) : null}
          </div>

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
                placeholder={`Type the ${channel} message you want attendees to receive.`}
                rows={6}
                required
              />
            </label>

            <button
              className="btn btn-accent"
              type="submit"
              disabled={
                isSending ||
                !recipientsReady ||
                !message.trim() ||
                (mode === "single" && !selectedAttendeeId) ||
                (mode === "all" && filteredAttendeeCount === 0)
              }
            >
              {isSending ? <LoaderCircle className="spin" /> : <Send />}
              {isSending
                ? "Sending..."
                : mode === "all"
                  ? recipientsReady
                    ? `Send ${channel} blast to ${filteredAttendeeCount}`
                    : recipientError ? "Recipients unavailable" : "Loading recipients..."
                  : `Send attendee ${channel}`}
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

type MessagingClientProps = Omit<Parameters<typeof AdminMessagingClient>[0], "channel">;

export function AdminSmsClient(props: MessagingClientProps) {
  return <AdminMessagingClient {...props} channel="SMS" />;
}

export function AdminWhatsAppClient(props: MessagingClientProps) {
  return <AdminMessagingClient {...props} channel="WhatsApp" />;
}
