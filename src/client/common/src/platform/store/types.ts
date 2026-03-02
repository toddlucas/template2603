import type { SortingState } from '@tanstack/react-table';

//------------------------------
// Base Table State
//------------------------------

export interface ItemTableState<TKey> {
  // Pagination state
  currentPage: number;
  pageSize: number;

  // Search and filtering state
  searchTerm: string;
  sorting: SortingState;

  // UI state that should be preserved
  selectedId?: TKey;
  expandedRows?: string[];
}

//------------------------------
// Base Item State
//------------------------------

export interface ItemState<TItem, TKey> {
  // Data
  items: TItem[];
  totalCount: number;
  currentItem: TItem | null;

  // Table state (cached)
  tableState: ItemTableState<TKey>;

  // Loading states
  isLoadingList: boolean;
  isLoadingDetails: boolean;

  // Error states
  listError: string | null;
  detailsError: string | null;
}

//------------------------------
// Base Item Actions
//------------------------------

export interface ItemActions<TItem, TKey> {
  // Data actions
  setItems: (items: TItem[]) => void;
  setTotalCount: (count: number) => void;
  setCurrentItem: (item: TItem | null) => void;

  // Table state actions (cached)
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchTerm: (term: string) => void;
  setSorting: (sorting: SortingState) => void;
  setSelectedItemId: (id?: TKey) => void;
  setExpandedRows: (rows: string[]) => void;

  // Loading actions
  setLoadingList: (loading: boolean) => void;
  setLoadingDetails: (loading: boolean) => void;

  // Error actions
  setListError: (error: string | null) => void;
  setDetailsError: (error: string | null) => void;

  // Reset actions
  resetList: () => void;
  resetDetails: () => void;
  resetTableState: () => void;
  softResetTableState: () => void;
  resetSearch: () => void;
  resetPagination: () => void;
  resetSelection: () => void;
  resetAll: () => void;

  // Async actions
  fetchItems: () => Promise<void>;
  fetchItemDetails: (id: TKey) => Promise<void>;

  // Table state update actions that trigger API calls
  handleSearch: (searchTerm: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  handleSortingChange: (sorting: any) => Promise<void>;
  handlePageSizeChange: (newPageSize: number) => Promise<void>;
  handlePageChange: (newPage: number) => Promise<void>;

  // Table state update actions that don't trigger API calls
  handleSelectedItemChange: (id?: TKey) => void;
  handleExpandedRowsChange: (expandedRows: string[]) => void;

  // Table state persistence
  saveTableState: () => void;
  loadTableState: (currentPath: string) => void;
  shouldClearTableState: (currentPath: string) => boolean;
  clearTableState: () => void;
  loadTableStateForPath: (currentPath: string) => void;
}

//------------------------------
// CRUD Actions (for entities with full CRUD operations)
//------------------------------

export interface CrudActions<TItem, TKey> {
  // CRUD operations
  createItem: (item: Omit<TItem, 'id'>) => Promise<void>;
  updateItem: (item: TItem) => Promise<void>;
  deleteItem: (id: TKey) => Promise<void>;
  searchItems: (query: string) => Promise<void>;
}

//------------------------------
// Hierarchical Actions (for entities with parent-child relationships)
//------------------------------

export interface HierarchicalActions<TKey> {
  getRootItems: () => Promise<void>;
  getChildItems: (parentId: TKey) => Promise<void>;
}

//------------------------------
// Combined Store Types
//------------------------------

export type BaseItemStore<TItem, TKey> = ItemState<TItem, TKey> & ItemActions<TItem, TKey>;

export type CrudItemStore<TItem, TKey> = BaseItemStore<TItem, TKey> & CrudActions<TItem, TKey>;

export type HierarchicalItemStore<TItem, TKey> = BaseItemStore<TItem, TKey> & HierarchicalActions<TKey>;

export type FullCrudItemStore<TItem, TKey> = BaseItemStore<TItem, TKey> & CrudActions<TItem, TKey> & HierarchicalActions<TKey>;
