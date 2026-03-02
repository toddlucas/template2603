import React from 'react';
import TablePaginator from './TablePaginator';
import TablePageSizeSelector from './TablePageSizeSelector';

interface TableFooterProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageInfo?: boolean;
  adjacentPages?: number;
  pageSizeOptions?: number[];
}

const TableFooter: React.FC<TableFooterProps> = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageInfo = true,
  adjacentPages = 2,
  pageSizeOptions = [5, 10, 25, 50, 100]
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex-1">
        <TablePaginator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          showPageInfo={showPageInfo}
          adjacentPages={adjacentPages}
        />
      </div>

      <TablePageSizeSelector
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        options={pageSizeOptions}
      />
    </div>
  );
};

export default TableFooter;
