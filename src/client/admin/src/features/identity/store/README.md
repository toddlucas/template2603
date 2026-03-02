# User Store - Table State Caching

This directory contains the Zustand store implementation for the user feature with **table state caching** to preserve user's place in the table.

## 🎯 **Key Feature: Table State Persistence**

The main pain point this solves: **Losing your place when navigating back to a paginated table!**

- ✅ **Current page** is preserved
- ✅ **Search term** is preserved  
- ✅ **Sorting** is preserved
- ✅ **Page size** is preserved
- ✅ **Selected user** is preserved
- ✅ **Expanded rows** are preserved

## Files

- `types.ts` - TypeScript interfaces and types for the store
- `selectors.ts` - Computed state selectors
- `actions.ts` - Async actions and table state persistence
- `userStore.ts` - Main store definition
- `index.ts` - Export file for easy importing

## State Structure

### **Data State**
- `companies` - Current page of companies from API
- `totalCount` - Total number of companies
- `currentUser` - Currently viewed user details

### **Table State (Cached)**
- `currentPage` - Current page number
- `pageSize` - Number of items per page
- `searchTerm` - Current search term
- `sorting` - Current sorting configuration
- `selectedUserId` - Currently selected user
- `expandedRows` - Currently expanded rows

### **UI State**
- `isLoadingList` - Loading state for user list
- `isLoadingDetails` - Loading state for user details
- `listError` - Error state for list operations
- `detailsError` - Error state for details operations

## Usage

### **Basic Store Usage**

```typescript
import { useUserStore } from '../store';

// In a component
const UserList = () => {
  const companies = useUserStore(state => state.companies);
  const isLoading = useUserStore(state => state.isLoadingList);
  const fetchCompanies = useUserStore(state => state.fetchCompanies);
  
  // Use the store
};
```

### **Using Selectors**

```typescript
import { useUserStore, selectCompanies, selectIsLoadingList } from '../store';

// In a component
const UserList = () => {
  const companies = useUserStore(selectCompanies);
  const isLoading = useUserStore(selectIsLoadingList);
  
  // Use the selectors
};
```

### **Table State Persistence**

```typescript
import { useUserStore } from '../store';

// In a component
const UserList = () => {
  const { loadTableState, fetchCompanies } = useUserStore();
  
  useEffect(() => {
    // Load cached table state on mount
    const cachedState = loadTableState();
    
    // Fetch companies (will use cached state if available)
    fetchCompanies();
  }, []);
  
  // When user navigates back, they'll see the same page/search/sorting!
};
```

## Actions

### **Async Actions (Trigger API Calls)**
- `fetchCompanies()` - Fetches companies with current table state
- `fetchUserDetails(userId)` - Fetches details for a specific user
- `handleSearch(searchTerm)` - Updates search and fetches results
- `clearSearch()` - Clears search and fetches results
- `handleSortingChange(sorting)` - Updates sorting and fetches results
- `handlePageSizeChange(newPageSize)` - Updates page size and fetches results
- `handlePageChange(newPage)` - Changes page and fetches results

### **Synchronous Actions (No API Calls)**
- `handleSelectedUserChange(userId)` - Updates selected user
- `handleExpandedRowsChange(expandedRows)` - Updates expanded rows

### **Reset Actions**
- `resetTableState()` - Complete reset to defaults
- `softResetTableState()` - Reset pagination/search but preserve user preferences
- `resetSearch()` - Clear search and reset to first page
- `resetPagination()` - Reset to first page only
- `resetSelection()` - Clear selection and expanded rows
- `resetAll()` - Reset everything including data

### **Table State Persistence**
- `saveTableState()` - Saves current table state to localStorage
- `loadTableState()` - Loads table state from localStorage
- `clearTableState()` - Clears cached table state

## How Table State Caching Works

### **1. Initial Load**
```typescript
useEffect(() => {
  // Load cached state from localStorage
  const cachedState = loadTableState();
  
  // Fetch data using cached state (or defaults)
  fetchCompanies();
}, []);
```

### **2. State Changes**
```typescript
// API-triggering changes
handleSearch("acme"); // → API call + save state
handlePageChange(2);  // → API call + save state

// UI-only changes  
handleSelectedUserChange("123"); // → Save state only
```

### **3. Navigation**
```typescript
// User navigates to details page
// User clicks "Back to Companies"
// → Table state is restored from localStorage
// → User sees the same page, search, sorting they had before!
```

## Benefits

1. **🎯 Solves Main Pain Point** - No more losing your place in the table!
2. **⚡ Efficient** - Only API calls when data actually changes
3. **💾 Persistent** - State survives page refreshes and navigation
4. **🧹 Clean** - No complex data caching logic
5. **🔄 Responsive** - Instant UI updates for non-data changes
6. **📱 User-Friendly** - Seamless navigation experience

## Storage

Table state is automatically saved to `localStorage` under the key `'user-table-state'`:

```json
{
  "currentPage": 2,
  "pageSize": 10,
  "searchTerm": "acme",
  "sorting": [{"id": "name", "desc": false}],
  "selectedUserId": "123",
  "expandedRows": ["456", "789"]
}
```

## Location-Based State Preservation

The store automatically preserves table state based on the current URL path:

```typescript
const UserList = () => {
  const location = useLocation();
  const { loadTableStateForPath, fetchCompanies } = useUserStore();
  
  useEffect(() => {
    // Automatically preserves state for user list paths
    loadTableStateForPath(location.pathname);
    fetchCompanies();
  }, []);
};
```

### **State Preserving Paths**

The following paths automatically preserve table state:
- `/platform/user` - Main user list
- `/user` - Alternative user list path

**All other paths** will start with a fresh table state.

### **Simple Implementation**

```typescript
import { useLocation } from 'react-router-dom';

const UserList = () => {
  const location = useLocation();
  const { loadTableStateForPath, fetchCompanies } = useUserStore();
  
  useEffect(() => {
    loadTableStateForPath(location.pathname);
    fetchCompanies();
  }, []);
};
```

## Reset Best Practices

### **When to Use Each Reset Type**

#### **Complete Reset (`resetTableState`)**
```typescript
// Use when user explicitly wants to "start over"
const handleStartOver = () => {
  resetTableState();
  fetchCompanies();
};
```
- User clicks "Reset All" button
- Switching between different data sets
- After major data changes that invalidate current state

#### **Soft Reset (`softResetTableState`)**
```typescript
// Use after data refresh - preserve user preferences
const handleRefresh = async () => {
  softResetTableState();
  await fetchCompanies();
};
```
- After data refresh/update
- When you want to preserve user's preferred page size and sorting
- **Most common use case**

#### **Partial Resets**
```typescript
// Clear search only
const handleClearSearch = () => {
  clearSearch(); // Triggers API call
};

// Reset to first page only
const handleGoToFirst = () => {
  resetPagination();
  fetchCompanies();
};

// Clear selection only
const handleClearSelection = () => {
  resetSelection();
};
```

### **Reset Triggers**

| Action | Recommended Reset | Why |
|--------|------------------|-----|
| Data refresh | `softResetTableState()` | Preserve user preferences |
| Clear search | `clearSearch()` | Clear search + API call |
| "Start over" | `resetTableState()` | Complete reset |
| Clear selection | `resetSelection()` | UI state only |
| Go to first page | `resetPagination()` | Navigation only |

### **Automatic Resets**

The store automatically handles some resets:
- **Search changes** → Reset to page 1
- **Sorting changes** → Reset to page 1  
- **Page size changes** → Reset to page 1
- **Selection changes** → No automatic reset

## Error Handling

- **localStorage failures** are gracefully handled with console warnings
- **API errors** are properly managed in the store
- **Invalid cached state** falls back to defaults

This approach provides the **best of both worlds**: efficient server-side pagination with persistent user experience! 