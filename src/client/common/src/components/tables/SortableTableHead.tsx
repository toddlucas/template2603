import { flexRender, type Header } from '@tanstack/react-table';
import { TableHead } from '$/components/ui/table';

interface SortableTableHeadProps<TData> {
  header: Header<TData, unknown>;
}

const SortableTableHead = <TData,>({ header }: SortableTableHeadProps<TData>) => {
  return (
    <TableHead
      key={header.id}
      onClick={header.column.getToggleSortingHandler()}
      className={header.column.getCanSort() ? 'cursor-pointer hover:bg-muted/50' : ''}
    >
      <div className="flex items-center space-x-1">
        <span>
          {flexRender(
            header.column.columnDef.header,
            header.getContext()
          )}
        </span>
        {header.column.getCanSort() && (
          <span className="text-muted-foreground">
            {{
              asc: '↑',
              desc: '↓',
            }[header.column.getIsSorted() as string] ?? '↕'}
          </span>
        )}
      </div>
    </TableHead>
  );
};

export default SortableTableHead;

