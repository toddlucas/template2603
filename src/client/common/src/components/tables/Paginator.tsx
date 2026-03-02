import React from 'react';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageInfo?: boolean;
  showPageSize?: boolean;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  adjacentPages?: number; // Number of adjacent pages to show on each side
}

/**
 * Shows a paginator with adjacent pages.
 * [«] [‹] [1] [...] [8] [9] [10] [11] [12] [...] [99] [100] [›] [»]
 */
const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showPageInfo = true,
  showPageSize = false,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  adjacentPages = 2
}) => {
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(event.target.value));
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return pages;
    }

    const startPage = Math.max(1, currentPage - adjacentPages);
    const endPage = Math.min(totalPages, currentPage + adjacentPages);

    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Show pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1 && !showPageSize) {
    return null;
  }

  return (
    <div className={className}>
      <nav aria-label="Page navigation">
        <ul className="flex items-center space-x-1">
          {/* First Page */}
          <li>
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                currentPage === 1
                  ? 'text-tertiary bg-header cursor-not-allowed'
                  : 'text-secondary bg-surface border border-standard hover:bg-surface-hover hover:text-primary'
              }`}
              aria-label="First page"
              title="First page"
              tabIndex={currentPage === 1 ? -1 : undefined}
              aria-disabled={currentPage === 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </li>

          {/* Previous Page */}
          <li>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                currentPage === 1
                  ? 'text-tertiary bg-header cursor-not-allowed'
                  : 'text-secondary bg-surface border border-standard hover:bg-surface-hover hover:text-primary'
              }`}
              aria-label="Previous page"
              title="Previous page"
              tabIndex={currentPage === 1 ? -1 : undefined}
              aria-disabled={currentPage === 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </li>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {typeof page === 'number' ? (
                <li>
                  <button
                    onClick={() => onPageChange(page)}
                    className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                      page === currentPage
                        ? 'text-on-primary bg-primary border border-primary'
                        : 'text-secondary bg-surface border border-standard hover:bg-surface-hover hover:text-primary'
                    }`}
                    aria-label={`Page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                </li>
              ) : (
                <li>
                  <span className="inline-flex items-center px-3 py-1 text-tertiary" aria-hidden="true">
                    {page}
                  </span>
                </li>
              )}
            </React.Fragment>
          ))}

          {/* Next Page */}
          <li>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                currentPage >= totalPages
                  ? 'text-tertiary bg-header cursor-not-allowed'
                  : 'text-secondary bg-surface border border-standard hover:bg-surface-hover hover:text-primary'
              }`}
              aria-label="Next page"
              title="Next page"
              tabIndex={currentPage >= totalPages ? -1 : undefined}
              aria-disabled={currentPage >= totalPages}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </li>

          {/* Last Page */}
          <li>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                currentPage >= totalPages
                  ? 'text-tertiary bg-header cursor-not-allowed'
                  : 'text-secondary bg-surface border border-standard hover:bg-surface-hover hover:text-primary'
              }`}
              aria-label="Last page"
              title="Last page"
              tabIndex={currentPage >= totalPages ? -1 : undefined}
              aria-disabled={currentPage >= totalPages}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
              </svg>
            </button>
          </li>
        </ul>
      </nav>

      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-muted mt-3">
          Page {currentPage} of {totalPages}
        </div>
      )}

      {/* Page Size Selector */}
      {showPageSize && pageSize && onPageSizeChange && (
        <div className="flex items-center space-x-2 mt-3">
          <label htmlFor="page-size" className="text-sm font-medium text-primary">
            Show:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-3 py-1.5 text-sm text-on-surface bg-surface border border-standard rounded-md focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-colors duration-200"
            style={{ width: 'auto' }}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted">per page</span>
        </div>
      )}
    </div>
  );
};

export default Paginator;
