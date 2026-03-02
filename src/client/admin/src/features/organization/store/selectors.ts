import type { OrganizationStore } from './types';

// Data selectors
export const selectItems = (state: OrganizationStore) => state.items;
export const selectTotalCount = (state: OrganizationStore) => state.totalCount;
export const selectCurrentItem = (state: OrganizationStore) => state.currentItem;

// Table state selectors
export const selectCurrentPage = (state: OrganizationStore) => state.tableState.currentPage;
export const selectPageSize = (state: OrganizationStore) => state.tableState.pageSize;
export const selectSearchTerm = (state: OrganizationStore) => state.tableState.searchTerm;
export const selectSorting = (state: OrganizationStore) => state.tableState.sorting;
export const selectSelectedId = (state: OrganizationStore) => state.tableState.selectedId;
export const selectExpandedRows = (state: OrganizationStore) => state.tableState.expandedRows;

// Loading state selectors
export const selectIsLoadingList = (state: OrganizationStore) => state.isLoadingList;
export const selectIsLoadingDetails = (state: OrganizationStore) => state.isLoadingDetails;

// Error state selectors
export const selectListError = (state: OrganizationStore) => state.listError;
export const selectDetailsError = (state: OrganizationStore) => state.detailsError;

// Computed selectors
export const selectTotalPages = (state: OrganizationStore) =>
  Math.ceil(state.totalCount / state.tableState.pageSize);

export const selectHasItems = (state: OrganizationStore) => state.items.length > 0;

export const selectIsSearching = (state: OrganizationStore) =>
  state.tableState.searchTerm.length > 0;

export const selectCanGoToNextPage = (state: OrganizationStore) =>
  state.tableState.currentPage < Math.ceil(state.totalCount / state.tableState.pageSize);

export const selectCanGoToPreviousPage = (state: OrganizationStore) =>
  state.tableState.currentPage > 1;

export const selectSelectedItem = (state: OrganizationStore) =>
  state.items.find(item => item.id === state.tableState.selectedId);

export const selectFilteredItems = (state: OrganizationStore) => {
  if (!state.tableState.searchTerm) return state.items;

  const searchTerm = state.tableState.searchTerm.toLowerCase();
  return state.items.filter(item =>
    item.name.toLowerCase().includes(searchTerm) ||
    item.code?.toLowerCase().includes(searchTerm) ||
    item.status?.toLowerCase().includes(searchTerm)
  );
};
