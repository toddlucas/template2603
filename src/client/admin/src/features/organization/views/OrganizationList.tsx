import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  useOrganizationStore,
  selectItems,
  selectIsLoadingList,
  selectListError,
  selectCurrentPage,
  selectPageSize,
  selectTotalPages,
  selectSorting,
  selectSearchTerm
} from '../store';
import type { OrganizationModel } from '$/models/access';
import PageHeader from '$/components/layout/PageHeader';
import LoadingSpinner from '$/components/feedback/LoadingSpinner';
import ErrorAlert from '$/components/feedback/ErrorAlert';
import EmptyState from '$/components/feedback/EmptyState';
import SortableTableHead from '$/components/tables/SortableTableHead';

const ActionColumn = ({ id }: { id: number }) => {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" asChild>
        <Link
          title="View"
          to={`/organization/${id}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <Link
          title="Edit"
          to={`/organization/${id}/edit`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <Link
          title="Delete"
          to={`/organization/${id}/delete`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Link>
      </Button>
    </div>
  );
};

const StatusBadge = ({ status }: { status?: string }) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status || 'Unknown'}
    </span>
  );
};

const columnHelper = createColumnHelper<OrganizationModel>();

const OrganizationList = () => {
  const location = useLocation();
  const { t } = useTranslation("organization");

  // Get state from store
  const organizations = useOrganizationStore(selectItems);
  const isLoading = useOrganizationStore(selectIsLoadingList);
  const error = useOrganizationStore(selectListError);
  const currentPage = useOrganizationStore(selectCurrentPage);
  const pageSize = useOrganizationStore(selectPageSize);
  const totalPages = useOrganizationStore(selectTotalPages);
  const sorting = useOrganizationStore(selectSorting);
  const searchTerm = useOrganizationStore(selectSearchTerm);
  void searchTerm; // Unused

  // Get actions from store
  const {
    fetchItems: fetchOrganizations,
    handleSearch,
    handleSortingChange,
    handlePageSizeChange,
    handlePageChange,
    shouldClearTableState,
    softResetTableState
  } = useOrganizationStore();

  useEffect(() => {
    const fromPath = location.state?.from;

    // Clear location.state, which gets set by the Link component, but gets cached.
    window.history.replaceState({}, '')

    if (shouldClearTableState(fromPath || location.pathname)) {
      softResetTableState();
    }

    // Fetch organizations (will use cached state if available)
    fetchOrganizations();
  }, [shouldClearTableState, softResetTableState, fetchOrganizations, location.state?.from, location.pathname]); // Only run on mount

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
      columnHelper.accessor('name', {
        id: 'name',
        header: t('Organization Name'),
        cell: info => (
          <div className="font-medium">{info.getValue()}</div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('code', {
        id: 'code',
        header: t('Code'),
        cell: info => (
          <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {info.getValue() || 'N/A'}
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('statusId', {
        id: 'statusId',
        header: t('Status'),
        cell: info => (
          <StatusBadge status={info.getValue()?.toString()} />
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('parentOrgId', {
        id: 'parentOrgId',
        header: t('Parent Organization'),
        cell: info => {
          const parentId = info.getValue();
          if (!parentId) return <span className="text-muted-foreground">Root Organization</span>;

          // Find parent organization name
          const parentOrg = organizations.find(org => org.id === parentId);
          return (
            <div className="text-sm">
              {parentOrg ? parentOrg.name : `ID: ${parentId}`}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor('metadata', {
        id: 'metadata',
        header: t('Description'),
        cell: info => (
          <div className="text-sm text-muted-foreground max-w-xs truncate">
            {info.getValue() || 'No description'}
          </div>
        ),
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: t('Actions'),
        cell: info => (
          <ActionColumn id={info.row.original.id} />
        ),
      }),
    ],
    [organizations, t]
  );

  /* Server-side pagination */
  const table = useReactTable({
    data: organizations,
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
        title={t("Organizations")}
        description={t("Manage organizations and their hierarchy")}
        search={{
          placeholder: "Search organizations...",
          onChange: handleSearchChange
        }}
        actions={
          <Button asChild>
            <Link to="/organization/new">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Organization
            </Link>
          </Button>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && <LoadingSpinner message="Loading organizations..." />}

        {/* Error State */}
        {error && (
          <ErrorAlert
            title="Error loading organizations"
            message={error}
          />
        )}

        {/* Organizations Table */}
        {organizations.length > 0 && !isLoading && (
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
        {organizations.length === 0 && !isLoading && !error && (
          <EmptyState
            icon={
              <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="No organizations found"
            description="Get started by creating a new organization."
            action={
              <Button asChild>
                <Link to="/organization/new">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Organization
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default OrganizationList;
