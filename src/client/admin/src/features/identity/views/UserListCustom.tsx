import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import ListSearch from '$/components/tables/ListSearch';
import TableFooter from '$/components/tables/TableFooter';
import {
  useUserStore,
  selectItems,
  selectIsLoadingList,
  selectListError,
  selectCurrentPage,
  selectPageSize,
  selectTotalPages,
  selectSorting
} from '../store';
import type { IdentityUserModel } from '$/models/identity-user-model';

const ActionColumn = ({ id }: { id: string }) => {
  return (
    <div className="flex items-center gap-2">
      <Link
        className="inline-flex items-center justify-center w-8 h-8 text-muted hover:text-primary transition-colors duration-200 rounded-md hover:bg-surface-hover"
        title="View"
        to={`/identity/user/${id}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </Link>
      <a
        className="inline-flex items-center justify-center w-8 h-8 text-muted hover:text-warning transition-colors duration-200 rounded-md hover:bg-surface-hover"
        title="Edit"
        href={`/identity/user/${id}/edit`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </a>
    </div>
  );
}

const columnHelper = createColumnHelper<IdentityUserModel<string>>();

const UserList = () => {
  const location = useLocation();

  // Get state from store
  const users = useUserStore(selectItems);
  const isLoading = useUserStore(selectIsLoadingList);
  const error = useUserStore(selectListError);
  const currentPage = useUserStore(selectCurrentPage);
  const pageSize = useUserStore(selectPageSize);
  const totalPages = useUserStore(selectTotalPages);
  const sorting = useUserStore(selectSorting);

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
  }, [location.state?.from, shouldClearTableState, softResetTableState, fetchUsers]); // Only run on mount

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
        header: 'User Name',
        cell: info => (
          <div className="font-medium text-on-surface">{info.getValue()}</div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('id', {
        id: 'id',
        header: 'ID',
        cell: info => (
          <div className="text-sm text-muted font-mono bg-panel px-2 py-1 rounded">
            {info.getValue()}
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('email', {
        id: 'email',
        header: 'Email',
        cell: info => (
          <div className="text-sm border-primary text-secondary">{info.getValue()}</div>
        ),
        enableSorting: true,
      }),
      // columnHelper.accessor('isActive', {
      //   id: 'is_active',
      //   header: 'Status',
      //   cell: info => (
      //     <span className={`badge ${info.getValue() ? 'bg-success' : 'bg-secondary'}`}>
      //       {info.getValue() ? 'Active' : 'Inactive'}
      //     </span>
      //   ),
      //   enableSorting: true,
      // }),
      // columnHelper.accessor('information.createdAt', {
      //   id: 'createdat',
      //   header: 'Created',
      //   cell: info => {
      //     const date = info.getValue();
      //     if (!date) return '-';

      //     // Format the date to be more readable
      //     return new Date(date).toLocaleDateString();
      //   },
      //   enableSorting: true,
      // }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <ActionColumn id={info.row.original.id.toString()} />
        ),
      }),
    ],
    []
  );

  /* Client-side pagination */
  /*
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  */

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
    <div className="min-h-screen bg-ambient">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-standard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-on-surface">Users</h1>
                <p className="mt-1 text-sm text-muted">
                  Manage user accounts and permissions
                </p>
              </div>
              <div className="flex-shrink-0">
                <ListSearch onSearch={handleSearchChange} placeholder="Search by user name" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-secondary">Loading users...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error">Error loading users</h3>
                <div className="mt-2 text-sm text-error">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        {users.length > 0 && !isLoading && (
          <div className="bg-card shadow-sm rounded-lg border border-standard overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-standard">
                <thead className="bg-panel">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider ${
                            header.column.getCanSort()
                              ? 'cursor-pointer hover:bg-surface-hover transition-colors duration-150'
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {header.column.getCanSort() && (
                              <span className="text-tertiary">
                                {{
                                  asc: '↑',
                                  desc: '↓',
                                }[header.column.getIsSorted() as string] ?? '↕'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-card divide-y divide-standard">
                  {table.getRowModel().rows.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={`${
                        rowIndex % 2 === 0 ? 'bg-card' : 'bg-panel'
                      } hover:bg-surface-hover transition-colors duration-150`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            <div className="bg-panel px-6 py-3 border-t border-standard">
              <TableFooter
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChangeWrapper}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {users.length === 0 && !isLoading && !error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-on-surface">No users found</h3>
            <p className="mt-1 text-sm text-secondary">
              Get started by creating a new user account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
