# Modular Zustand Store Pattern

This pattern demonstrates a structured approach to organizing complex Zustand stores using **file separation** and **type-driven architecture**.

## 🎯 **Pattern Overview**

This is a **modular store organization pattern** that splits a complex Zustand store into multiple focused files, each with a specific responsibility. It emphasizes strong typing, clear separation of concerns, and maintainable code structure.

## 📁 **File Structure**

```
store/
├── index.ts          # Public API exports
├── types.ts          # Type definitions and interfaces
├── selectors.ts      # Computed state selectors
├── actions.ts        # Business logic and async operations
├── [domain]Store.ts  # Main store definition and state management
└── README.md         # Documentation and usage examples
```

## 🏗️ **Architecture Components**

### **1. Types (`types.ts`)**
- **Core State Interface** - Defines the shape of the store state
- **Action Interface** - Defines all available store actions
- **Nested State Types** - Breaks down complex state into logical chunks
- **Store Type Union** - Combines state and actions into final store type

```typescript
export interface CoreState {
  // Data state
  data: DataModel[];
  currentItem: DataModel | null;
  
  // UI state  
  uiState: UIState;
  
  // Loading/error states
  isLoading: boolean;
  error: string | null;
}

export interface CoreActions {
  // Data actions
  setData: (data: DataModel[]) => void;
  setCurrentItem: (item: DataModel | null) => void;
  
  // Async actions
  fetchData: () => Promise<void>;
  
  // UI actions
  updateUIState: (state: Partial<UIState>) => void;
}

export type CoreStore = CoreState & CoreActions;
```

### **2. Selectors (`selectors.ts`)**
- **Raw State Selectors** - Direct state access
- **Computed Selectors** - Derived state calculations
- **Grouped Selectors** - Related selections bundled together
- **Performance Optimized** - Memoized complex calculations

```typescript
// Raw selectors
export const selectData = (state: CoreStore) => state.data;
export const selectIsLoading = (state: CoreStore) => state.isLoading;

// Computed selectors
export const selectDataCount = (state: CoreStore) => state.data.length;
export const selectHasData = (state: CoreStore) => state.data.length > 0;

// Complex selectors
export const selectProcessedData = (state: CoreStore) => {
  // Complex computation here
  return processedData;
};
```

### **3. Actions (`actions.ts`)**
- **Pure Functions** - Stateless business logic
- **Async Operations** - API calls and side effects
- **State Transformations** - Complex state updates
- **Reusable Logic** - Shared between different store methods

```typescript
// Async business logic
export const fetchData = async (
  getState: () => CoreStore, 
  set: (partial: Partial<CoreStore>) => void
) => {
  set({ isLoading: true, error: null });
  
  try {
    const data = await apiCall();
    set({ data, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
};

// State transformation logic
export const updateSpecificState = (
  getState: () => CoreStore,
  set: (partial: Partial<CoreStore>) => void,
  newValue: any
) => {
  const currentState = getState();
  const updatedState = {
    ...currentState.uiState,
    specificProperty: newValue
  };
  set({ uiState: updatedState });
};
```

### **4. Main Store (`[domain]Store.ts`)**
- **Store Creation** - Zustand store instantiation
- **State Initialization** - Default state values
- **Action Binding** - Connects actions to store methods
- **Simple Synchronous Actions** - Direct state updates

```typescript
const defaultState: CoreState = {
  data: [],
  currentItem: null,
  uiState: defaultUIState,
  isLoading: false,
  error: null,
};

export const useCoreStore = create<CoreStore>((set, get) => ({
  ...defaultState,

  // Simple synchronous actions
  setData: (data) => set({ data }),
  setCurrentItem: (item) => set({ currentItem: item }),
  
  // Async actions (delegated to actions.ts)
  fetchData: () => fetchData(get, set),
  updateSpecificState: (value) => updateSpecificState(get, set, value),
  
  // Reset actions
  reset: () => set(defaultState),
}));
```

### **5. Public API (`index.ts`)**
- **Controlled Exports** - Only expose what's needed
- **Clean Imports** - Single import point for consumers
- **Type Safety** - Re-export types for convenience

```typescript
export { useCoreStore } from './coreStore';
export * from './types';
export * from './selectors';
// Note: actions.ts typically not exported (internal implementation)
```

## 🔧 **Key Principles**

### **1. Separation of Concerns**
- **Types** = Shape and contracts
- **Selectors** = Data access and computation
- **Actions** = Business logic and side effects
- **Store** = State management and coordination

### **2. Pure Functions in Actions**
- Actions receive `getState` and `set` as parameters
- No direct store access inside action functions
- Easier to test and reason about
- Reusable across different stores

### **3. Type-Driven Development**
- Define types first, implementation follows
- Strong contracts between components
- IntelliSense and compile-time safety
- Self-documenting interfaces

### **4. Layered Architecture**
```
Components
    ↓ (use selectors)
Selectors (computed state)
    ↓ (read from)
Store (state management)
    ↓ (delegates to)
Actions (business logic)
    ↓ (calls)
Services/APIs
```

## ✅ **Benefits**

### **1. Maintainability**
- Clear file boundaries and responsibilities
- Easy to locate and modify specific functionality
- Reduced cognitive load per file

### **2. Testability**
- Actions are pure functions (easy to unit test)
- Selectors can be tested independently
- Store logic is isolated and focused

### **3. Reusability**
- Actions can be shared between stores
- Selectors can be composed and reused
- Type definitions can be extended

### **4. Scalability**
- New functionality maps to specific files
- Team members can work on different aspects
- Large stores remain manageable

### **5. Type Safety**
- Compile-time error detection
- Better IDE support and refactoring
- Self-documenting contracts

## 📋 **Usage Pattern**

### **In Components**
```typescript
import { useCoreStore, selectData, selectIsLoading } from '../store';

const Component = () => {
  // Preferred: Use selectors
  const data = useCoreStore(selectData);
  const isLoading = useCoreStore(selectIsLoading);
  
  // Actions
  const { fetchData, updateSpecificState } = useCoreStore();
  
  // Use the store
};
```

### **Component Organization**
```typescript
// Multiple subscriptions with selectors
const data = useCoreStore(selectData);
const count = useCoreStore(selectDataCount);
const isLoading = useCoreStore(selectIsLoading);

// Actions (destructured once)
const { fetchData, reset } = useCoreStore();
```

## 🎨 **Variations**

### **For Simple Stores**
- Combine `actions.ts` into main store file
- Keep `types.ts` and `selectors.ts` separate
- Maintain `index.ts` for clean exports

### **For Complex Domains**
- Split actions into multiple files (`dataActions.ts`, `uiActions.ts`)
- Group selectors by concern (`dataSelectors.ts`, `uiSelectors.ts`)
- Create sub-types files for complex state

### **For Shared Logic**
- Extract common patterns to shared utilities
- Create base types for common store patterns
- Build reusable action creators

## 🚀 **When to Use**

### **Good For:**
- Complex stores with multiple responsibilities
- Stores with significant business logic
- Long-lived, frequently modified stores
- Team development environments
- Stores requiring extensive testing

### **Consider Alternatives For:**
- Simple state with few actions
- Prototype or short-term code
- Single-developer projects
- Pure UI state without business logic

## 📝 **Best Practices**

### **1. File Organization**
- Keep related types together in `types.ts`
- Group related selectors in `selectors.ts`
- Organize actions by feature area
- Use consistent naming conventions

### **2. Type Definition**
- Define state interface first
- Create action interface separately
- Combine into store type union
- Export all types from `types.ts`

### **3. Selector Design**
- Start with simple state accessors
- Build computed selectors for derived data
- Use descriptive names (`selectHasData` vs `selectData`)
- Consider performance for complex computations

### **4. Action Implementation**
- Keep actions pure (no side dependencies)
- Handle loading/error states consistently
- Use async/await for clarity
- Group related state updates

This pattern provides a scalable, maintainable approach to complex state management while preserving the simplicity and performance benefits of Zustand.
