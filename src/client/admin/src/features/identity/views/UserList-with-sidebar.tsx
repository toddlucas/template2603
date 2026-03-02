import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { IdentityUserModel } from '$/models/identity-user-model';
import type { Breadcrumb } from '$/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$/components/ui/table';
import { Button } from '$/components/ui/button';
import TableFooter from '$/components/ui/tables/TableFooter';
import { useAppSidebar } from '$/features/frame/contexts/sidebar-context';
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
const ActionColumn = ({ id }: { id: string }) => {
  const handleUserSelect = (userId: string) => {
    // Update sidebar to show this user is selected
    // You could add a "selectedUser" to the sidebar selection state
    console.log(`User ${userId} selected`);

    // You could also update breadcrumbs or other sidebar state
    // sidebarHandle.actions.onSubItemSelect(`user-${userId}`, 'identity');
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" asChild>
        <Link
          title="View"
          to={`/identity/user/${id}`}
          onClick={() => handleUserSelect(id)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </Button>
    </div>
  );
};

export default function UserList() {
  const sidebarHandle = useAppSidebar();
  const location = useLocation();

  // Get data from your existing store
  const items = useUserStore(selectItems);
  const isLoadingList = useUserStore(selectIsLoadingList);
  const listError = useUserStore(selectListError);
  const currentPage = useUserStore(selectCurrentPage);
  const pageSize = useUserStore(selectPageSize);
  const totalPages = useUserStore(selectTotalPages);
  const sorting = useUserStore(selectSorting);

  // Update sidebar when component mounts or location changes
  useEffect(() => {
    // When this component mounts, ensure the sidebar reflects the current state
    sidebarHandle.actions.onNavItemSelect('identity');
    sidebarHandle.actions.onSubItemSelect('users', 'identity');
  }, [location.pathname, sidebarHandle.actions]);

  // Get current context from sidebar
  const currentTeam = sidebarHandle.selection.activeTeamId;
  const currentNavItem = sidebarHandle.selection.activeNavItemId;
  const breadcrumbs = sidebarHandle.getActiveBreadcrumbs();

  // Your existing table logic...
  const columnHelper = createColumnHelper<IdentityUserModel<string>>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('userName', {
        header: 'Username',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => <ActionColumn id={info.row.original.id} />,
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onSortingChange: () => {
      // Your existing sorting logic
    },
    onPaginationChange: () => {
      // Your existing pagination logic
    },
    pageCount: totalPages,
    manualPagination: true,
    manualSorting: true,
  });

  if (isLoadingList) {
    return <div>Loading...</div>;
  }

  if (listError) {
    return <div>Error: {listError}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Show current context from sidebar */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold">User Management</h2>
        <div className="text-sm text-gray-600">
          <p><strong>Team:</strong> {currentTeam || 'None selected'}</p>
          <p><strong>Section:</strong> {currentNavItem || 'None selected'}</p>
          <p><strong>Breadcrumbs:</strong> {breadcrumbs.map((b: Breadcrumb) => b.title).join(' > ')}</p>
        </div>
      </div>

      {/* Your existing table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TableFooter table={table} />
    </div>
  );
}
