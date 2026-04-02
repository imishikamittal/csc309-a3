// Generated using Claude
export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  for (let i = left; i <= right; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages} &middot; {total} total
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          &lsaquo;
        </button>
        {left > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition">1</button>
            {left > 2 && <span className="px-2 py-1.5 text-sm text-gray-400">…</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              p === page
                ? 'bg-primary-600 border-primary-600 text-white dark:bg-primary-500 dark:border-primary-500'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
        {right < totalPages && (
          <>
            {right < totalPages - 1 && <span className="px-2 py-1.5 text-sm text-gray-400">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
