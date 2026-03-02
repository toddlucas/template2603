# Client Testing

> **Module**: Patterns / Client  
> **Domain**: Testing  
> **Token target**: 400-500

## Purpose

Defines testing patterns for client-side code: components, services, and integration.

## Content to Include

### Component Testing

> **Note:** Use Vitest and React Testing Library. Test files go next to components with `.test.tsx` suffix.

```tsx
// File: components/{entity}/{Entity}List.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {Entity}List } from './{Entity}List';
import { TestProviders } from '$/test/TestProviders';

// Mock the service
const mockService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Mock the container
vi.mock('$/platform/di/ContainerContext', () => ({
  useContainer: () => ({
    get: () => mockService,
  }),
}));

describe('{Entity}List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockService.list.mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders items when loaded', async () => {
    mockService.list.mockResolvedValue({
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
      totalCount: 2,
    });

    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('renders error state on failure', async () => {
    mockService.list.mockRejectedValue(new Error('API Error'));

    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no items', async () => {
    mockService.list.mockResolvedValue({ data: [], totalCount: 0 });

    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/no.*found/i)).toBeInTheDocument();
    });
  });
});
```

### Service Testing

```tsx
// File: services/{Entity}Service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {Entity}Service } from './{Entity}Service';
import { {entity}Api } from '../api/{entity}Api';

vi.mock('../api/{entity}Api');

describe('{Entity}Service', () => {
  let service: {Entity}Service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new {Entity}Service();
  });

  describe('get', () => {
    it('returns entity when API succeeds', async () => {
      const mockEntity = { id: 1, name: 'Test' };
      vi.mocked({entity}Api.get).mockResolvedValue({ 
        ok: true, 
        value: mockEntity 
      });

      const result = await service.get(1);

      expect(result).toEqual(mockEntity);
      expect({entity}Api.get).toHaveBeenCalledWith(1);
    });

    it('throws ApiError when API fails', async () => {
      vi.mocked({entity}Api.get).mockResolvedValue({
        ok: false,
        error: new Response(null, { status: 404 }),
      });

      await expect(service.get(1)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('returns created entity when API succeeds', async () => {
      const input = { name: 'New' };
      const created = { id: 1, name: 'New' };
      vi.mocked({entity}Api.create).mockResolvedValue({ 
        ok: true, 
        value: created 
      });

      const result = await service.create(input);

      expect(result).toEqual(created);
    });
  });
});
```

### Test Patterns Summary

| Test Type | What to Test | Pattern |
|-----------|--------------|---------|
| Loading | Shows loading indicator | Mock pending promise → Assert loading UI |
| Success | Renders data correctly | Mock resolved data → Assert items visible |
| Error | Shows error message | Mock rejection → Assert error UI |
| Empty | Shows empty state | Mock empty array → Assert empty message |
| Interaction | User actions work | Render → fireEvent → Assert result |

### i18n Testing

```tsx
// Verify translations resolve
it('renders with correct translations', async () => {
  render(
    <TestProviders locale="en">
      <{Entity}List />
    </TestProviders>
  );

  // Check that translation keys resolve (not showing raw keys)
  await waitFor(() => {
    expect(screen.queryByText(/^[A-Z][a-z]+ [A-Z][a-z]+$/)).not.toBeInTheDocument();
  });
});

// Test different locales
it.each(['en', 'de', 'es', 'fr', 'el'])('renders in %s locale', async (locale) => {
  render(
    <TestProviders locale={locale}>
      <{Entity}List />
    </TestProviders>
  );

  // Should not have missing translation warnings
  await waitFor(() => {
    expect(console.warn).not.toHaveBeenCalled();
  });
});
```

### TestProviders Setup

```tsx
// File: test/TestProviders.tsx
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '$/i18n/i18n-test'; // Test i18n instance

interface TestProvidersProps {
  children: React.ReactNode;
  locale?: string;
  initialRoute?: string;
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  locale = 'en',
  initialRoute = '/',
}) => {
  i18n.changeLanguage(locale);

  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </I18nextProvider>
  );
};
```

### What to Test Checklist

- [ ] **Loading states** - Shows spinner/skeleton while fetching
- [ ] **Success states** - Renders data correctly
- [ ] **Error states** - Shows error message, allows retry
- [ ] **Empty states** - Shows appropriate message
- [ ] **User interactions** - Buttons, forms, navigation work
- [ ] **i18n** - Translations resolve in all locales
- [ ] **Accessibility** - Key elements have proper labels

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific feature
npm test -- --filter="{feature}"

# Run with coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch
```

## Backlink

- [Testing Strategy](../../../overview/client/testing-strategy.md) - Comprehensive testing approach
- [Testing Patterns](../../../patterns/client/testing-patterns.md) - Additional patterns

