import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { OrganizationStore } from './types';
import type { OrganizationModel, OrganizationDetailModel } from '$/models/access';
// Enum imports removed - no longer needed for mock data
import * as organizationApi from '../api/organizationApi';

// Mock data removed - now using real API with server seed data

// API wrapper - now always uses real API
const api = {
  async getOrganizations(page: number = 0, pageSize: number = 10, search?: string, sorting?: Array<{ id: string; desc: boolean }>): Promise<{ items: OrganizationModel[], totalCount: number }> {
    return await organizationApi.fetchOrganizations(page, pageSize, search, sorting);
  },

  async getOrganization(id: number): Promise<OrganizationDetailModel | null> {
    return await organizationApi.fetchOrganizationDetails(id);
  },

  async createOrganization(organization: Omit<OrganizationModel, 'id'>): Promise<OrganizationModel> {
    return await organizationApi.createOrganization(organization);
  },

  async updateOrganization(organization: OrganizationModel): Promise<OrganizationModel> {
    return await organizationApi.updateOrganization(organization);
  },

  async deleteOrganization(id: number): Promise<void> {
    return await organizationApi.deleteOrganization(id);
  }
};

export const useOrganizationStore = create<OrganizationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      items: [],
      totalCount: 0,
      currentItem: null as OrganizationDetailModel | null,
      tableState: {
        currentPage: 1,
        pageSize: 10,
        searchTerm: '',
        sorting: [],
        selectedId: undefined,
        expandedRows: []
      },
      isLoadingList: false,
      isLoadingDetails: false,
      listError: null,
      detailsError: null,

      // Data actions
      setItems: (items) => set({ items }),
      setTotalCount: (count) => set({ totalCount: count }),
      setCurrentItem: (item: OrganizationDetailModel | null) => set({ currentItem: item }),

      // Table state actions
      setCurrentPage: (page) => set((state) => ({ ...state, tableState: { ...state.tableState, currentPage: page } })),
      setPageSize: (size) => set((state) => ({ ...state, tableState: { ...state.tableState, pageSize: size } })),
      setSearchTerm: (term) => set((state) => ({ ...state, tableState: { ...state.tableState, searchTerm: term } })),
      setSorting: (sorting) => set((state) => ({ ...state, tableState: { ...state.tableState, sorting } })),
      setSelectedItemId: (id) => set((state) => ({ ...state, tableState: { ...state.tableState, selectedId: id } })),
      setExpandedRows: (rows) => set((state) => ({ ...state, tableState: { ...state.tableState, expandedRows: rows } })),

      // Loading actions
      setLoadingList: (loading) => set({ isLoadingList: loading }),
      setLoadingDetails: (loading) => set({ isLoadingDetails: loading }),

      // Error actions
      setListError: (error) => set({ listError: error }),
      setDetailsError: (error) => set({ detailsError: error }),

      // Reset actions
      resetList: () => set({ items: [], totalCount: 0, listError: null }),
      resetDetails: () => set({ currentItem: null as OrganizationDetailModel | null, detailsError: null }),
      resetTableState: () => set({
        tableState: {
          currentPage: 1,
          pageSize: 10,
          searchTerm: '',
          sorting: [],
          selectedId: undefined,
          expandedRows: []
        }
      }),
      softResetTableState: () => set((state) => ({
        ...state,
        tableState: {
          ...state.tableState,
          currentPage: 1,
          searchTerm: '',
          sorting: []
        }
      })),
      resetSearch: () => set((state) => ({
        ...state,
        tableState: { ...state.tableState, searchTerm: '' }
      })),
      resetPagination: () => set((state) => ({
        ...state,
        tableState: { ...state.tableState, currentPage: 1 }
      })),
      resetSelection: () => set((state) => ({
        ...state,
        tableState: { ...state.tableState, selectedId: undefined, expandedRows: [] }
      })),
      resetAll: () => set({
        items: [],
        totalCount: 0,
        currentItem: null as OrganizationDetailModel | null,
        tableState: {
          currentPage: 1,
          pageSize: 10,
          searchTerm: '',
          sorting: [],
          selectedId: undefined,
          expandedRows: []
        },
        isLoadingList: false,
        isLoadingDetails: false,
        listError: null,
        detailsError: null
      }),

      // Table state update actions that don't trigger API calls
      handleSelectedItemChange: (id) => set((state) => ({
        ...state,
        tableState: { ...state.tableState, selectedId: id }
      })),
      handleExpandedRowsChange: (rows) => set((state) => ({
        ...state,
        tableState: { ...state.tableState, expandedRows: rows }
      })),

      // Table state persistence
      saveTableState: () => {
        const state = get();
        const stateToSave = {
          currentPage: state.tableState.currentPage,
          pageSize: state.tableState.pageSize,
          searchTerm: state.tableState.searchTerm,
          sorting: state.tableState.sorting,
          selectedId: state.tableState.selectedId,
          expandedRows: state.tableState.expandedRows
        };
        localStorage.setItem('organizationTableState', JSON.stringify(stateToSave));
      },
      loadTableState: () => {
        try {
          const savedState = localStorage.getItem('organizationTableState');
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            set((state) => ({
              ...state,
              tableState: { ...state.tableState, ...parsedState }
            }));
          }
        } catch (error) {
          console.warn('Failed to load organization table state:', error);
        }
      },
      shouldClearTableState: (currentPath) => {
        if (!currentPath) return true; // Clear state if no path provided
        return !currentPath.startsWith('/organization');
      },
      clearTableState: () => {
        localStorage.removeItem('organizationTableState');
        set((state) => ({
          ...state,
          tableState: {
            currentPage: 1,
            pageSize: 10,
            searchTerm: '',
            sorting: [],
            selectedId: undefined,
            expandedRows: []
          }
        }));
      },
      loadTableStateForPath: (currentPath) => {
        const state = get();
        if (!currentPath || !currentPath.startsWith('/organization')) {
          state.clearTableState();
        } else {
          state.loadTableState(currentPath);
        }
      },

      // Async actions
      fetchItems: async () => {
        const state = get();
        set({ isLoadingList: true, listError: null });

        try {
          const { items, totalCount } = await api.getOrganizations(
            state.tableState.currentPage,
            state.tableState.pageSize,
            state.tableState.searchTerm || undefined,
            state.tableState.sorting
          );

          set({ items, totalCount });
        } catch (error) {
          set({ listError: error instanceof Error ? error.message : 'Failed to fetch organizations' });
        } finally {
          set({ isLoadingList: false });
        }
      },

      fetchItemDetails: async (id) => {
        set({ isLoadingDetails: true, detailsError: null });

        try {
          const item = await api.getOrganization(id);
          set({ currentItem: item });
        } catch (error) {
          set({ detailsError: error instanceof Error ? error.message : 'Failed to fetch organization details' });
        } finally {
          set({ isLoadingDetails: false });
        }
      },

      // Table state update actions that trigger API calls
      handleSearch: async (searchTerm) => {
        set((state) => ({
          ...state,
          tableState: { ...state.tableState, searchTerm, currentPage: 1 }
        }));
        await get().fetchItems();
      },

      clearSearch: async () => {
        set((state) => ({
          ...state,
          tableState: { ...state.tableState, searchTerm: '', currentPage: 1 }
        }));
        await get().fetchItems();
      },

      handleSortingChange: async (sorting) => {
        set((state) => ({
          ...state,
          tableState: { ...state.tableState, sorting }
        }));
        await get().fetchItems();
      },

      handlePageSizeChange: async (newPageSize) => {
        set((state) => ({
          ...state,
          tableState: { ...state.tableState, pageSize: newPageSize, currentPage: 1 }
        }));
        await get().fetchItems();
      },

      handlePageChange: async (newPage) => {
        set((state) => ({
          ...state,
          tableState: { ...state.tableState, currentPage: newPage }
        }));
        await get().fetchItems();
      },

      // CRUD actions
      createItem: async (organization) => {
        try {
          await api.createOrganization(organization);
          // Refresh the list to include the new organization
          await get().fetchItems();
        } catch (error) {
          set({ listError: error instanceof Error ? error.message : 'Failed to create organization' });
        }
      },

      updateItem: async (organization) => {
        try {
          await api.updateOrganization(organization);
          // Refresh the list to reflect changes
          await get().fetchItems();
        } catch (error) {
          set({ listError: error instanceof Error ? error.message : 'Failed to update organization' });
        }
      },

      deleteItem: async (id) => {
        try {
          await api.deleteOrganization(id);
          // Refresh the list to reflect changes
          await get().fetchItems();
        } catch (error) {
          set({ listError: error instanceof Error ? error.message : 'Failed to delete organization' });
        }
      },

      searchItems: async (query) => {
        await get().handleSearch(query);
      },

      // Hierarchical actions
      getRootItems: async () => {
        // This would be a specific API call for root organizations
        await get().fetchItems();
      },

      getChildItems: async (parentId) => {
        // This would be a specific API call for child organizations
        // For now, just fetch all items - in the future this would filter by parentId
        console.log('Getting child items for parent:', parentId);
        await get().fetchItems();
      }
    }),
    {
      name: 'organization-store'
    }
  )
);
