import type { SortingState } from '@tanstack/react-table';
import type { OrganizationStore } from './types';
import type { OrganizationModel, OrganizationDetailModel } from '$/models/access';

// Data actions
export const setItems = (state: OrganizationStore, items: OrganizationModel[]) => {
  state.items = items;
};

export const setTotalCount = (state: OrganizationStore, count: number) => {
  state.totalCount = count;
};

export const setCurrentItem = (state: OrganizationStore, item: OrganizationDetailModel | null) => {
  state.currentItem = item;
};

// Table state actions
export const setCurrentPage = (state: OrganizationStore, page: number) => {
  state.tableState.currentPage = page;
};

export const setPageSize = (state: OrganizationStore, size: number) => {
  state.tableState.pageSize = size;
};

export const setSearchTerm = (state: OrganizationStore, term: string) => {
  state.tableState.searchTerm = term;
};

export const setSorting = (state: OrganizationStore, sorting: SortingState) => {
  state.tableState.sorting = sorting;
};

export const setSelectedItemId = (state: OrganizationStore, id?: number) => {
  state.tableState.selectedId = id;
};

export const setExpandedRows = (state: OrganizationStore, rows: string[]) => {
  state.tableState.expandedRows = rows;
};

// Loading actions
export const setLoadingList = (state: OrganizationStore, loading: boolean) => {
  state.isLoadingList = loading;
};

export const setLoadingDetails = (state: OrganizationStore, loading: boolean) => {
  state.isLoadingDetails = loading;
};

// Error actions
export const setListError = (state: OrganizationStore, error: string | null) => {
  state.listError = error;
};

export const setDetailsError = (state: OrganizationStore, error: string | null) => {
  state.detailsError = error;
};

// Reset actions
export const resetList = (state: OrganizationStore) => {
  state.items = [];
  state.totalCount = 0;
  state.listError = null;
};

export const resetDetails = (state: OrganizationStore) => {
  state.currentItem = null;
  state.detailsError = null;
};

export const resetTableState = (state: OrganizationStore) => {
  state.tableState = {
    currentPage: 1,
    pageSize: 10,
    searchTerm: '',
    sorting: [],
    selectedId: undefined,
    expandedRows: []
  };
};

export const softResetTableState = (state: OrganizationStore) => {
  state.tableState.currentPage = 1;
  state.tableState.searchTerm = '';
  state.tableState.sorting = [];
};

export const resetSearch = (state: OrganizationStore) => {
  state.tableState.searchTerm = '';
};

export const resetPagination = (state: OrganizationStore) => {
  state.tableState.currentPage = 1;
};

export const resetSelection = (state: OrganizationStore) => {
  state.tableState.selectedId = undefined;
  state.tableState.expandedRows = [];
};

export const resetAll = (state: OrganizationStore) => {
  resetList(state);
  resetDetails(state);
  resetTableState(state);
};

// Table state update actions that don't trigger API calls
export const handleSelectedItemChange = (state: OrganizationStore, id?: number) => {
  state.tableState.selectedId = id;
};

export const handleExpandedRowsChange = (state: OrganizationStore, expandedRows: string[]) => {
  state.tableState.expandedRows = expandedRows;
};

// Table state persistence
export const saveTableState = (state: OrganizationStore) => {
  const stateToSave = {
    currentPage: state.tableState.currentPage,
    pageSize: state.tableState.pageSize,
    searchTerm: state.tableState.searchTerm,
    sorting: state.tableState.sorting,
    selectedId: state.tableState.selectedId,
    expandedRows: state.tableState.expandedRows
  };

  localStorage.setItem('organizationTableState', JSON.stringify(stateToSave));
};

export const loadTableState = (state: OrganizationStore) => {
  try {
    const savedState = localStorage.getItem('organizationTableState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      state.tableState = {
        ...state.tableState,
        ...parsedState
      };
    }
  } catch (error) {
    console.warn('Failed to load organization table state:', error);
  }
};

export const shouldClearTableState = (state: OrganizationStore, currentPath: string) => {
  // Clear state when navigating away from organization pages
  return !currentPath.startsWith('/organization');
};

export const clearTableState = (state: OrganizationStore) => {
  localStorage.removeItem('organizationTableState');
  resetTableState(state);
};

export const loadTableStateForPath = (state: OrganizationStore, currentPath: string) => {
  if (shouldClearTableState(state, currentPath)) {
    clearTableState(state);
  } else {
    loadTableState(state);
  }
};
