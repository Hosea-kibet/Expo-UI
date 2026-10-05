type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export function AdminPagination({ page, pageSize, total, isLoading, onPageChange }: AdminPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from(new Set([
    1,
    ...Array.from({ length: 5 }, (_, index) => page + index - 2)
      .filter((value) => value > 1 && value < pageCount),
    pageCount,
  ])).sort((left, right) => left - right);

  return (
    <nav className="admin-pagination" aria-label="Attendee pages">
      <span>
        {total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}` : "0 records"}
      </span>
      <div className="admin-pagination-actions">
        <button className="btn btn-light sm" type="button" disabled={isLoading || page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        {pages.map((value, index) => (
          <span className="admin-pagination-page" key={value}>
            {index > 0 && value - pages[index - 1] > 1 ? <span aria-hidden="true">…</span> : null}
            <button
              className={`btn ${value === page ? "btn-accent" : "btn-light"} sm`}
              type="button"
              aria-label={`Page ${value}`}
              aria-current={value === page ? "page" : undefined}
              disabled={isLoading || value === page}
              onClick={() => onPageChange(value)}
            >
              {value}
            </button>
          </span>
        ))}
        <button className="btn btn-light sm" type="button" disabled={isLoading || page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
