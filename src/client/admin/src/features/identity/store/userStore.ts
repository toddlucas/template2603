import { create } from 'zustand';
import type { SortingState } from '@tanstack/react-table';
import type { UserStore, UserTableState } from './types';
import {
  fetchItems,
  fetchItemDetails,
  handleSearch,
  clearSearch,
  handleSortingChange,
  handlePageSizeChange,
  handlePageChange,
  handleSelectedItemChange,
  handleExpandedRowsChange,
  saveTableState,
  loadTableState,
  clearTableState,
  loadTableStateForPath,
  shouldClearTableState,
} from './actions';

const defaultTableState: UserTableState = {
  currentPage: 1,
  pageSize: 10,
  searchTerm: '',
  sorting: [],
  selectedId: undefined,
  expandedRows: [],
};

const initialState = {
  // Data
  items: [],
  totalCount: 0,
  currentItem: null,

  // Table state (cached)
  tableState: defaultTableState,

  // Loading states
  isLoadingList: false,
  isLoadingDetails: false,

  // Error states
  listError: null,
  detailsError: null,
};

export const useUserStore = create<UserStore>((set, get) => ({
  ...initialState,

  // Data actions
  setItems: (items) => set({ items }),
  setTotalCount: (count) => set({ totalCount: count }),
  setCurrentItem: (item) => set({ currentItem: item }),

  // Table state actions (cached)
  setCurrentPage: (page) => set({
    tableState: { ...get().tableState, currentPage: page }
  }),
  setPageSize: (size) => set({
    tableState: { ...get().tableState, pageSize: size }
  }),
  setSearchTerm: (term) => set({
    tableState: { ...get().tableState, searchTerm: term }
  }),
  setSorting: (sorting) => set({
    tableState: { ...get().tableState, sorting }
  }),
  setSelectedItemId: (id) => set({
    tableState: { ...get().tableState, selectedId: id }
  }),
  setExpandedRows: (rows) => set({
    tableState: { ...get().tableState, expandedRows: rows }
  }),

  // Loading actions
  setLoadingList: (loading) => set({ isLoadingList: loading }),
  setLoadingDetails: (loading) => set({ isLoadingDetails: loading }),

  // Error actions
  setListError: (error) => set({ listError: error }),
  setDetailsError: (error) => set({ detailsError: error }),

  // Reset actions
  resetList: () => set({
    items: [],
    totalCount: 0,
    isLoadingList: false,
    listError: null,
  }),

  resetDetails: () => set({
    currentItem: null,
    isLoadingDetails: false,
    detailsError: null,
  }),

  resetTableState: () => set({
    tableState: defaultTableState,
  }),

  // Soft reset - preserve user preferences
  softResetTableState: () => set({
    tableState: {
      ...get().tableState,
      currentPage: 1,
      searchTerm: '',
      selectedId: undefined,
      expandedRows: [],
      // Keep: pageSize, sorting (user preferences)
    }
  }),

  // Partial resets
  resetSearch: () => set({
    tableState: {
      ...get().tableState,
      searchTerm: '',
      currentPage: 1, // Reset to first page when clearing search
    }
  }),

  resetPagination: () => set({
    tableState: {
      ...get().tableState,
      currentPage: 1,
    }
  }),

  resetSelection: () => set({
    tableState: {
      ...get().tableState,
      selectedId: undefined,
      expandedRows: [],
    }
  }),

  resetAll: () => set(initialState),

  // Async actions
  fetchItems: () => fetchItems(get, set),
  fetchItemDetails: (id: string) => fetchItemDetails(get, set, id),

  // Table state update actions that trigger API calls
  handleSearch: (searchTerm: string) => handleSearch(get, set, searchTerm),
  clearSearch: () => clearSearch(get, set),
  handleSortingChange: (sorting: SortingState) => handleSortingChange(get, set, sorting),
  handlePageSizeChange: (newPageSize: number) => handlePageSizeChange(get, set, newPageSize),
  handlePageChange: (newPage: number) => handlePageChange(get, set, newPage),

  // Table state update actions that don't trigger API calls
  handleSelectedItemChange: (id?: string) => handleSelectedItemChange(get, set, id),
  handleExpandedRowsChange: (expandedRows: string[]) => handleExpandedRowsChange(get, set, expandedRows),

  // Table state persistence
  saveTableState: () => saveTableState(get),
  loadTableState: (currentPath) => loadTableState(set, currentPath),
  shouldClearTableState: (currentPath) => shouldClearTableState(currentPath),
  clearTableState: () => clearTableState(),
  loadTableStateForPath: (currentPath) => loadTableStateForPath(set, currentPath),
}));
