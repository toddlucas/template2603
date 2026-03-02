import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../pagination';

interface TablePaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageInfo?: boolean;
  adjacentPages?: number; // Number of adjacent pages to show on each side
}

/**
 * Shadcn-based paginator with adjacent pages.
 * Uses shadcn/ui pagination components for consistent styling.
 */
const TablePaginator: React.FC<TablePaginatorProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showPageInfo = true,
  adjacentPages = 2
}) => {
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

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              size="default"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) {
                  onPageChange(currentPage - 1);
                }
              }}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {typeof page === 'number' ? (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page);
                    }}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </React.Fragment>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              size="default"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                  onPageChange(currentPage + 1);
                }
              }}
              className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-muted-foreground mt-3 text-center">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
};

export default TablePaginator;
