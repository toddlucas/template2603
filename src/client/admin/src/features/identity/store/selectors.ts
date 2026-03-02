import type { UserState } from './types';

type ItemState = UserState;

// Data selectors
export const selectItems = (state: ItemState) => state.items;
export const selectTotalCount = (state: ItemState) => state.totalCount;
export const selectCurrentItem = (state: ItemState) => state.currentItem;

// Table state selectors
export const selectTableState = (state: ItemState) => state.tableState;
export const selectCurrentPage = (state: ItemState) => state.tableState.currentPage;
export const selectPageSize = (state: ItemState) => state.tableState.pageSize;
export const selectSearchTerm = (state: ItemState) => state.tableState.searchTerm;
export const selectSorting = (state: ItemState) => state.tableState.sorting;
export const selectSelectedItemId = (state: ItemState) => state.tableState.selectedId;
export const selectExpandedRows = (state: ItemState) => state.tableState.expandedRows;

// Loading selectors
export const selectIsLoadingList = (state: ItemState) => state.isLoadingList;
export const selectIsLoadingDetails = (state: ItemState) => state.isLoadingDetails;

// Error selectors
export const selectListError = (state: ItemState) => state.listError;
export const selectDetailsError = (state: ItemState) => state.detailsError;

// Computed selectors
export const selectTotalPages = (state: ItemState) => {
  return Math.ceil(state.totalCount / state.tableState.pageSize);
};

export const selectHasItems = (state: ItemState) => {
  return state.items.length > 0;
};

export const selectIsFirstPage = (state: ItemState) => {
  return state.tableState.currentPage === 1;
};

export const selectIsLastPage = (state: ItemState) => {
  return state.tableState.currentPage >= Math.ceil(state.totalCount / state.tableState.pageSize);
};

export const selectHasError = (state: ItemState) => {
  return state.listError !== null || state.detailsError !== null;
};

export const selectIsLoading = (state: ItemState) => {
  return state.isLoadingList || state.isLoadingDetails;
};

// Pagination info selector
export const selectPaginationInfo = (state: ItemState) => {
  const totalPages = Math.ceil(state.totalCount / state.tableState.pageSize);
  const startItem = (state.tableState.currentPage - 1) * state.tableState.pageSize + 1;
  const endItem = Math.min(state.tableState.currentPage * state.tableState.pageSize, state.totalCount);

  return {
    currentPage: state.tableState.currentPage,
    totalPages,
    totalCount: state.totalCount,
    pageSize: state.tableState.pageSize,
    startItem,
    endItem,
    hasNextPage: state.tableState.currentPage < totalPages,
    hasPrevPage: state.tableState.currentPage > 1,
  };
};

// Table state persistence selector
export const selectTableStateForPersistence = (state: ItemState) => {
  return {
    currentPage: state.tableState.currentPage,
    pageSize: state.tableState.pageSize,
    searchTerm: state.tableState.searchTerm,
    sorting: state.tableState.sorting,
    selectedId: state.tableState.selectedId,
    expandedRows: state.tableState.expandedRows,
  };
};
