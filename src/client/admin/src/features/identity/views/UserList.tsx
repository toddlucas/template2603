import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '$/components/ui/table';
import { Button } from '$/components/ui/button';
import TableFooter from '$/components/ui/tables/TableFooter';
import {
  useUserStore,
  selectItems,
  selectIsLoadingList,
  selectListError,
  selectCurrentPage,
  selectPageSize,
  selectTotalPages,
  selectSorting,
  selectSearchTerm
} from '../store';
import type { IdentityUserModel } from '$/models/identity-user-model';
import PageHeader from '$/components/layout/PageHeader';
import LoadingSpinner from '$/components/feedback/LoadingSpinner';
import ErrorAlert from '$/components/feedback/ErrorAlert';
import EmptyState from '$/components/feedback/EmptyState';
import SortableTableHead from '$/components/tables/SortableTableHead';

const ActionColumn = ({ id }: { id: string }) => {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" asChild>
        <Link
          title="View"
          to={`/identity/user/${id}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <a
          title="Edit"
          href={`/identity/user/${id}/edit`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </a>
      </Button>
    </div>
  );
}

const columnHelper = createColumnHelper<IdentityUserModel<string>>();

const Users = () => {
  const location = useLocation();
  const { t } = useTranslation("identity");

  // Get state from store
  const users = useUserStore(selectItems);
  const isLoading = useUserStore(selectIsLoadingList);
  const error = useUserStore(selectListError);
  const currentPage = useUserStore(selectCurrentPage);
  const pageSize = useUserStore(selectPageSize);
  const totalPages = useUserStore(selectTotalPages);
  const sorting = useUserStore(selectSorting);
  const searchTerm = useUserStore(selectSearchTerm);
  void searchTerm; // Unused

  // Get actions from store
  const {
    fetchItems: fetchUsers,
    handleSearch,
    handleSortingChange,
    handlePageSizeChange,
    handlePageChange,
    shouldClearTableState,
    softResetTableState
  } = useUserStore();

  useEffect(() => {
    const fromPath = location.state?.from;

    // Clear location.state, which gets set by the Link component, but gets cached.
    window.history.replaceState({}, '')

    if (shouldClearTableState(fromPath)) {
      softResetTableState();
    }

    // Fetch users (will use cached state if available)
    fetchUsers();
  }, [shouldClearTableState, softResetTableState, fetchUsers, location.state?.from]); // Only run on mount

  const setPagination: OnChangeFn<PaginationState> = (updaterOrValue: Updater<PaginationState>) => {
    if (typeof updaterOrValue === 'function') {
      // Handle function updater - TanStack Table uses zero-based pageIndex
      const newPagination = updaterOrValue({ pageIndex: currentPage - 1, pageSize });
      handlePageChange(newPagination.pageIndex + 1); // Convert back to one-based
    } else {
      // Handle direct value - TanStack Table uses zero-based pageIndex
      handlePageChange(updaterOrValue.pageIndex + 1); // Convert back to one-based
    }
  }

  const handleSearchChange = (searchTerm: string) => {
    handleSearch(searchTerm);
  };

  const handleSortingChangeWrapper: OnChangeFn<SortingState> = (updaterOrValue: Updater<SortingState>) => {
    if (typeof updaterOrValue === 'function') {
      const newSorting = updaterOrValue(sorting);
      handleSortingChange(newSorting);
    } else {
      handleSortingChange(updaterOrValue);
    }
  };

  const handlePageSizeChangeWrapper = (newPageSize: number) => {
    handlePageSizeChange(newPageSize);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('userName', {
        id: 'userName',
        header: t("User Name"),
        cell: info => (
          <div className="font-medium">{info.getValue()}</div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('id', {
        id: 'id',
        header: t("ID"),
        cell: info => (
          <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {info.getValue()}
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('email', {
        id: 'email',
        header: t("Email"),
        cell: info => (
          <div className="text-sm text-muted-foreground">{info.getValue()}</div>
        ),
        enableSorting: true,
      }),
      columnHelper.display({
        id: 'actions',
        header: t("Actions"),
        cell: info => (
          <ActionColumn id={info.row.original.id.toString()} />
        ),
      }),
    ],
    [t]
  );

  /* Server-side pagination */
  const table = useReactTable({
    data: users,
    columns,
    // Tell TanStack this is manual pagination and sorting
    manualPagination: true,
    manualSorting: true,
    // Total count from API
    pageCount: totalPages,
    // Current page and sorting state
    state: {
      pagination: {
        pageIndex: currentPage - 1, // TanStack Table uses zero-based indexing
        pageSize: pageSize,
      },
      sorting,
    },
    // Handle page and sorting changes
    onPaginationChange: setPagination,
    onSortingChange: handleSortingChangeWrapper,
    // Required even for manual pagination/sorting
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title={t("Users")}
        description={t("Manage user accounts and permissions")}
        search={{
          placeholder: t("Search by user name"),
          onChange: handleSearchChange
        }}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && <LoadingSpinner message="Loading users..." />}

        {/* Error State */}
        {error && (
          <ErrorAlert
            title={t("Error loading users")}
            message={error}
          />
        )}

        {/* Users Table */}
        {users.length > 0 && !isLoading && (
          <div className="bg-card shadow-sm rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <SortableTableHead key={header.id} header={header} />
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Table Footer with Pagination */}
            <div className="bg-muted/50 px-6 py-3 border-t">
              <TableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChangeWrapper}
                showPageInfo={true}
                adjacentPages={2}
                pageSizeOptions={[10, 20, 30, 40, 50]}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {users.length === 0 && !isLoading && !error && (
          <EmptyState
            icon={
              <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            title={t("No users found")}
            description={t("Get started by creating a new user account.")}
          />
        )}
      </div>
    </div>
  );
};

export default Users;
