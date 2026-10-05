"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, RefreshCw, Search, Send, X } from "lucide-react";
import { AdminPagination } from "@/src/components/admin-pagination";
import { PageBodyClass } from "@/src/components/page-body-class";
import type { AttendeeListResult } from "@/src/lib/server/strapi-admin";
import { VISITOR_PASS_RESEND_BATCH_SIZE, type VisitorPassChannel, type VisitorPassResendResult } from "@/src/lib/visitor-pass-resend";

async function loadPage(page: number, search: string, signal: AbortSignal): Promise<AttendeeListResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: "20", hasVisitorPass: "true" });
  if (search) params.set("q", search);
  const response = await fetch(`/api/admin/attendees?${params}`, {
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
  });
  const result = await response.json() as AttendeeListResult & { ok: boolean; error?: string };
  if (!response.ok || !result.ok || !Array.isArray(result.attendees) || !result.pagination) {
    throw new Error(result.error ?? "Unable to load attendees.");
  }
  return result;
}

export function AdminResendClient({ adminName }: { adminName: string }) {
  const [data, setData] = useState<AttendeeListResult>({ attendees: [], search: "", pagination: { page: 1, pageSize: 20, total: 0, pageCount: 1 } });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState("");
  const [sendError, setSendError] = useState("");
  const [results, setResults] = useState<VisitorPassResendResult[]>([]);
  const runController = useRef<AbortController | null>(null);
  const stopRequested = useRef(false);

  useEffect(() => () => { stopRequested.current = true; runController.current?.abort(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError("");
    void loadPage(page, search, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Unable to load attendees.");
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [page, search, reload]);

  const ready = !isLoading && !loadError && searchInput.trim() === search && data.pagination.page === page;
  const selectedCount = allMatching ? Math.max(0, data.pagination.total - excluded.size) : selected.size;
  const isSelected = (id: string) => allMatching ? !excluded.has(id) : selected.has(id);
  const pageSelected = data.attendees.length > 0 && data.attendees.every((attendee) => isSelected(attendee.documentId));

  function clearSelection() {
    setSelected(new Set());
    setAllMatching(false);
    setExcluded(new Set());
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function toggleAttendee(id: string) {
    if (allMatching) {
      setExcluded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    } else {
      setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    }
  }

  function togglePage() {
    if (allMatching) {
      setExcluded((current) => {
        const next = new Set(current);
        data.attendees.forEach((attendee) => { if (pageSelected) next.add(attendee.documentId); else next.delete(attendee.documentId); });
        return next;
      });
    } else {
      setSelected((current) => {
        const next = new Set(current);
        data.attendees.forEach((attendee) => { if (pageSelected) next.delete(attendee.documentId); else next.add(attendee.documentId); });
        return next;
      });
    }
  }

  async function handleResend() {
    if (!ready || isSending || selectedCount === 0) return;
    const controller = new AbortController();
    runController.current = controller;
    stopRequested.current = false;
    setIsSending(true);
    setSendError("");
    setResults([]);
    const completed: VisitorPassResendResult[] = [];
    try {
      let ids = [...selected];
      if (allMatching) {
        setProgress("Preparing matching attendees...");
        const first = await loadPage(1, search, controller.signal);
        const matchingIds = new Set(first.attendees.map((attendee) => attendee.documentId));
        setProgress(`Preparing attendees: ${matchingIds.size} of ${first.pagination.total.toLocaleString()}`);
        const pageCount = Math.ceil(first.pagination.total / 20);
        for (let nextPage = 2; nextPage <= pageCount && !stopRequested.current; nextPage += 4) {
          const pages = await Promise.all(Array.from(
            { length: Math.min(4, pageCount - nextPage + 1) },
            (_, index) => loadPage(nextPage + index, search, controller.signal),
          ));
          pages.forEach((result) => result.attendees.forEach((attendee) => matchingIds.add(attendee.documentId)));
          setProgress(`Preparing attendees: ${matchingIds.size} of ${first.pagination.total.toLocaleString()}`);
        }
        ids = [...matchingIds].filter((id) => !excluded.has(id));
      }
      for (let index = 0; index < ids.length && !stopRequested.current; index += VISITOR_PASS_RESEND_BATCH_SIZE) {
        setProgress(`Resending Visitor Passes: ${completed.length} of ${ids.length.toLocaleString()} attendees`);
        const batch = ids.slice(index, index + VISITOR_PASS_RESEND_BATCH_SIZE);
        const response = await fetch("/api/admin/resend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendeeDocumentIds: batch }),
          signal: controller.signal,
        });
        const result = await response.json() as { ok: boolean; results?: VisitorPassResendResult[]; error?: string };
        if (!response.ok || !result.ok || !Array.isArray(result.results)) {
          throw new Error(result.error ?? "Unable to resend Visitor Passes. The current batch may have been sent; check before retrying.");
        }
        completed.push(...result.results);
        setResults([...completed]);
      }
      setProgress(stopRequested.current
        ? `Stopped after processing ${completed.length} attendees.`
        : `Finished processing ${completed.length} attendees.`);
    } catch (error) {
      if (!controller.signal.aborted) {
        setSendError(error instanceof Error ? error.message : "Unable to resend Visitor Passes.");
        setProgress(`Stopped after processing ${completed.length} attendees.`);
      }
    } finally {
      if (!controller.signal.aborted) setIsSending(false);
    }
  }

  const channels: VisitorPassChannel[] = ["Email", "WhatsApp", "SMS"];
  const successful = results.filter((result) => result.deliveries.length === 3 && result.deliveries.every((delivery) => delivery.status === "sent")).length;
  const failures = results.filter((result) => result.error || result.deliveries.some((delivery) => delivery.status === "failed"));

  return (
    <>
      <PageBodyClass className="admin-attendees-page" />
      <header className="admin-attendees-header">
        <div><div className="eyebrow">Event Admin</div><h1>Resend Visitor Pass</h1><p>{adminName ? `Signed in as ${adminName}.` : "Visitor Pass delivery"}</p></div>
        <Link className="btn btn-secondary" href="/admin"><ArrowLeft /> Back to attendee admin</Link>
      </header>
      <main className="admin-attendees-shell">
        <section className="admin-table-card admin-resend-card">
          <div className="admin-card-head"><div><div className="eyebrow">Resend</div><h2>Your 2026 AIAE Visitor Pass</h2></div><Send /></div>
          <p>Resend the original email, WhatsApp Visitor Pass and SMS with the attendee’s existing reference and QR code.</p>
          <p>Only attendees with a verified Visitor Pass appear here. Selections are kept as you search or change pages.</p>
          <label className="admin-search-field admin-resend-search"><Search /><input
            className="admin-search-input"
            aria-label="Search attendees"
            value={searchInput}
            disabled={isSending}
            onChange={(event) => { setSearchInput(event.target.value); setAllMatching(false); setExcluded(new Set()); }}
            placeholder="Name, email, phone, company or reference"
          /></label>
          <div className="admin-resend-selection">
            <strong>{selectedCount.toLocaleString()} selected{allMatching ? " across all matching pages" : ""}</strong>
            <button className="btn btn-light sm" type="button" disabled={!ready || isSending || data.pagination.total === 0} onClick={() => { setAllMatching(true); setSelected(new Set()); setExcluded(new Set()); }}>
              Select all {data.pagination.total.toLocaleString()} matching attendees
            </button>
            <button className="btn btn-light sm" type="button" disabled={isSending || (selectedCount === 0 && !searchInput && !search && page === 1)} onClick={clearSelection}><X /> Clear selection</button>
          </div>
          {loadError ? <div className="admin-inline-message is-error" role="alert"><AlertCircle /><span>{loadError}</span><button className="btn btn-light sm" type="button" onClick={() => setReload((current) => current + 1)}><RefreshCw /> Retry</button></div> : null}
          {isLoading ? <div className="admin-loading-state" role="status"><LoaderCircle className="spin" /> Loading attendees...</div> : null}
          <div className="admin-table-wrap">
            <table className="admin-attendees-table">
              <thead><tr><th><input type="checkbox" aria-label="Select attendees on this page" checked={pageSelected} disabled={!ready || isSending || data.attendees.length === 0} onChange={togglePage} /></th><th>Attendee</th><th>Visitor Pass reference</th><th>Phone</th></tr></thead>
              <tbody>
                {data.attendees.map((attendee) => (
                  <tr key={attendee.documentId}>
                    <td data-label="Select"><input type="checkbox" aria-label={`Select ${attendee.firstName} ${attendee.lastName}`} checked={isSelected(attendee.documentId)} disabled={!ready || isSending} onChange={() => toggleAttendee(attendee.documentId)} /></td>
                    <td data-label="Attendee"><strong>{attendee.firstName} {attendee.lastName}</strong><span>{attendee.email}</span><span>{attendee.company}</span></td>
                    <td data-label="Visitor Pass reference">{attendee.registrationReference}</td>
                    <td data-label="Phone">{attendee.fullPhoneNumber || attendee.phone}</td>
                  </tr>
                ))}
                {!isLoading && !loadError && data.attendees.length === 0 ? <tr><td colSpan={4} className="admin-empty-cell">No Visitor Passes match this search.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} pageSize={20} total={data.pagination.total} isLoading={isLoading || isSending || searchInput.trim() !== search} onPageChange={setPage} />
          <div className="admin-resend-selection">
            <button className="btn btn-accent" type="button" disabled={!ready || isSending || selectedCount === 0} onClick={() => void handleResend()}>
              {isSending ? <LoaderCircle className="spin" /> : <Send />}
              {isSending ? "Resending..." : `Resend Visitor Pass to ${selectedCount.toLocaleString()} attendees`}
            </button>
            {isSending ? <button className="btn btn-light" type="button" onClick={() => { stopRequested.current = true; }}>Stop after current batch</button> : null}
          </div>
          {progress ? <div className="admin-inline-message is-info" role="status" aria-live="polite">{isSending ? <LoaderCircle className="spin" /> : <CheckCircle2 />}<span>{progress}{results.length ? ` ${successful} sent on all three channels; ${results.length - successful} need attention.` : ""}</span></div> : null}
          {sendError ? <div className="admin-inline-message is-error" role="alert"><AlertCircle /><span>{sendError}</span></div> : null}
          {results.length ? (
            <div className="admin-sms-summary-grid">
              {channels.map((channel) => {
                const deliveries = results.flatMap((result) => result.deliveries).filter((delivery) => delivery.channel === channel);
                return <div className="admin-sms-summary" key={channel}><small>{channel}</small><strong>{deliveries.filter((delivery) => delivery.status === "sent").length} sent</strong><span>{deliveries.filter((delivery) => delivery.status === "failed").length} failed</span></div>;
              })}
            </div>
          ) : null}
          {failures.length ? <details className="admin-resend-failures"><summary>{failures.length} attendees need attention</summary><ul>{failures.map((result) => <li key={result.documentId}><strong>{result.name || result.documentId}{result.registrationReference ? ` (${result.registrationReference})` : ""}</strong>: {result.error || result.deliveries.filter((delivery) => delivery.status === "failed").map((delivery) => `${delivery.channel}: ${delivery.error}`).join("; ")}</li>)}</ul></details> : null}
        </section>
      </main>
    </>
  );
}
