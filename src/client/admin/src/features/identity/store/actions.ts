import type { SortingState } from '@tanstack/react-table';
import { get as apiGet, makePageQueryString } from '$/api';
import { ApiError } from '$/api/ApiError';
import type { IdentityUserModel } from '$/models/identity-user-model';
import type { UserStore, UserTableState } from './types';
import type { PagedQuery, PagedResult } from '$/models';

// Storage key for table state persistence
const TABLE_STATE_STORAGE_KEY = 'user-table-state';
const LIST_API_PATH = '/api/identity/user/list';
const DETAILS_API_PATH = '/api/identity/user?id={id}';

type ItemStore = UserStore;
type ItemTableState = UserTableState;
type ItemModel = IdentityUserModel<string>;

// Async action to fetch items list with current table state
export const fetchItems = async (getState: () => ItemStore, set: (partial: Partial<ItemStore>) => void) => {
  const state = getState();
  const { currentPage, pageSize, searchTerm, sorting } = state.tableState;

  const pageQuery: PagedQuery = {
    limit: pageSize,
    page: currentPage, // API uses 1-based page indexing
    search: searchTerm || undefined,
    column: sorting.length > 0 ? [sorting[0].id] : undefined,
    direction: sorting.length > 0 ? [sorting[0].desc ? 'desc' : 'asc'] : undefined,
  };

  set({ isLoadingList: true, listError: null });

  try {
    const queryString = makePageQueryString(pageQuery);
    const response = await apiGet(LIST_API_PATH + queryString);

    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response, 'Failed to fetch user list');
      throw apiError;
    }

    const result = await response.json() as PagedResult<ItemModel>;

    set({
      items: result.items,
      totalCount: result.count,
      isLoadingList: false,
    });
  } catch (error) {
    set({
      listError: ApiError.extractErrorMessage(error),
      items: [],
      isLoadingList: false,
    });
  }
};

// Async action to fetch item details
export const fetchItemDetails = async (
  _getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void,
  id: string
) => {
  set({ isLoadingDetails: true, detailsError: null });

  try {
    const response = await apiGet(DETAILS_API_PATH.replace('{id}', encodeURIComponent(id)));

    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response, 'Failed to fetch user details');
      throw apiError;
    }

    const data = await response.json() as ItemModel;

    set({
      currentItem: data,
      isLoadingDetails: false,
    });
  } catch (error) {
    set({
      detailsError: ApiError.extractErrorMessage(error),
      currentItem: null,
      isLoadingDetails: false,
    });
  }
};

// Table state persistence actions
export const saveTableState = (getState: () => ItemStore) => {
  const state = getState();
  const tableState = {
    currentPage: state.tableState.currentPage,
    pageSize: state.tableState.pageSize,
    searchTerm: state.tableState.searchTerm,
    sorting: state.tableState.sorting,
    selectedId: state.tableState.selectedId,
    expandedRows: state.tableState.expandedRows,
  };

  try {
    localStorage.setItem(TABLE_STATE_STORAGE_KEY, JSON.stringify(tableState));
  } catch (error) {
    console.warn('Failed to save table state to localStorage:', error);
  }
};

// Simple state loading with location-based preservation
export const loadTableState = (
  set: (partial: Partial<ItemStore>) => void,
  currentPath: string
): ItemTableState | null => {
  // List of paths that should preserve table state
  const statePreservingPaths = [
    LIST_API_PATH, // Main item list
  ];

  // If current path doesn't preserve state, do a soft reset
  if (!statePreservingPaths.includes(currentPath)) {
    console.log('Path does not preserve state, starting fresh');
    return null;
  }

  try {
    const stored = localStorage.getItem(TABLE_STATE_STORAGE_KEY);
    if (stored) {
      const tableState = JSON.parse(stored) as ItemTableState;
      set({ tableState });
      return tableState;
    }
  } catch (error) {
    console.warn('Failed to load table state from localStorage:', error);
  }
  return null;
};

// Simple check to see if the table state should be cleared.
export const shouldClearTableState = (
  currentPath: string
): boolean => {
  // List of paths that should clear table state.
  const stateClearingPaths = [
    '/platform', // Main platform page
  ];

  // If current path doesn't preserve state, do a soft reset
  if (stateClearingPaths.includes(currentPath)) {
    console.log('Path should clear state');
    return true;
  }

  return false;
};

export const clearTableState = () => {
  try {
    localStorage.removeItem(TABLE_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear table state from localStorage:', error);
  }
};

// Simple navigation helper
export const loadTableStateForPath = (
  set: (partial: Partial<ItemStore>) => void,
  currentPath: string
) => {
  const cachedState = loadTableState(set, currentPath);

  if (cachedState) {
    console.log('Restored table state');
  } else {
    console.log('Starting fresh');
  }

  return cachedState;
};

// Table state update actions that trigger API calls
export const handleSearch = async (
  getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void,
  searchTerm: string
) => {
  set({
    tableState: {
      ...getState().tableState,
      searchTerm,
      currentPage: 1
    }
  });
  await fetchItems(getState, set);
  saveTableState(getState);
};

// Clear search and reset to first page
export const clearSearch = async (
  getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void
) => {
  set({
    tableState: {
      ...getState().tableState,
      searchTerm: '',
      currentPage: 1
    }
  });
  await fetchItems(getState, set);
  saveTableState(getState);
};

export const handleSortingChange = async (
  getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void,
  sorting: SortingState
) => {
  set({
    tableState: {
      ...getState().tableState,
      sorting,
      currentPage: 1
    }
  });
  await fetchItems(getState, set);
  saveTableState(getState);
};

export const handlePageSizeChange = async (
    getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void,
  newPageSize: number
) => {
  set({
    tableState: {
      ...getState().tableState,
      pageSize: newPageSize,
      currentPage: 1
    }
  });
  await fetchItems(getState, set);
  saveTableState(getState);
};

export const handlePageChange = async (
  getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void,
  newPage: number
) => {
  set({
    tableState: {
      ...getState().tableState,
      currentPage: newPage
    }
  });
  await fetchItems(getState, set);
  saveTableState(getState);
};

// Table state update actions that don't trigger API calls
export const handleSelectedItemChange = (
  getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void,
  id?: string
) => {
  set({
    tableState: {
      ...getState().tableState,
      selectedId: id
    }
  });
  saveTableState(getState);
};

export const handleExpandedRowsChange = (
  getState: () => ItemStore,
  set: (partial: Partial<ItemStore>) => void,
  expandedRows: string[]
) => {
  set({
    tableState: {
      ...getState().tableState,
      expandedRows
    }
  });
  saveTableState(getState);
};
