import Paginator from './Paginator';
import PageSizeSelector from './PageSizeSelector';

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

const TableFooter = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageInfo = true,
  adjacentPages = 2,
  pageSizeOptions = [5, 10, 25, 50, 100]
}: TableFooterProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex-1">
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          showPageInfo={showPageInfo}
          showPageSize={false}
          adjacentPages={adjacentPages}
        />
      </div>

      <PageSizeSelector
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        options={pageSizeOptions}
      />
    </div>
  );
};

export default TableFooter;
