# Testing Patterns

## Overview

This document describes the technical patterns and best practices for testing React components and TypeScript code in the Product Name client. It covers unit testing, component testing, integration testing, and provides concrete examples using our testing stack.

## Testing Stack

- **Vitest**: Test runner and assertion library (Jest-compatible API)
- **React Testing Library**: Component testing focused on user behavior
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **Playwright**: End-to-end browser testing

## Directory Structure

### Test Organization

```
src/client/
├── common/
│   └── src/
│       ├── testing/                        # Test utilities and setup
│       │   ├── setup.ts                    # Global test configuration
│       │   ├── utils/
│       │   │   ├── test-helpers.ts         # Reusable test utilities
│       │   │   └── render-helpers.tsx      # Custom render functions
│       │   └── mocks/
│       │       ├── handlers.ts             # MSW request handlers
│       │       └── server.ts               # MSW server setup
│       ├── tests/                          # Integration tests
│       │   ├── auth-flow.test.ts
│       │   └── user-workflow.test.ts
│       ├── services/
│       │   └── auth/
│       │       ├── authService.ts
│       │       └── authService.test.ts     # Colocated unit test
│       └── components/
│           └── Button/
│               ├── Button.tsx
│               └── Button.test.tsx         # Colocated component test
│
├── web/
│   └── src/
│       ├── testing/                        # App-specific test utilities
│       │   ├── setup.ts
│       │   └── test-data.ts
│       ├── tests/                          # App-level integration tests
│       │   └── sequence-workflow.test.ts
│       └── views/
│           └── sequences/
│               ├── SequenceBuilder.tsx
│               └── SequenceBuilder.test.tsx
│
└── e2e/                                    # End-to-end tests
    ├── tests/
    │   ├── auth.spec.ts
    │   ├── contacts.spec.ts
    │   └── sequences.spec.ts
    ├── fixtures/
    │   └── test-data.json
    └── playwright.config.ts
```

### Key Principles

1. **Colocated Tests**: Unit and component tests live next to their source files
2. **Centralized Utilities**: Shared test utilities in `testing/` directories
3. **Integration Tests**: Multi-component tests in `tests/` directories
4. **E2E Separation**: Browser tests in separate `e2e/` directory at client root

## Unit Testing Patterns

### Testing Pure Functions

```typescript
// src/lib/formatters.ts
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// src/lib/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatPhoneNumber } from './formatters';

describe('formatPhoneNumber', () => {
  it('should format 10-digit phone number', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('should handle already formatted numbers', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
  });

  it('should return original for invalid lengths', () => {
    expect(formatPhoneNumber('123')).toBe('123');
  });
});
```

### Testing Services with Dependencies

```typescript
// src/services/contactService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactService } from './contactService';
import type { ApiClient } from '../api/apiClient';

describe('ContactService', () => {
  let mockApiClient: ApiClient;
  let contactService: ContactService;

  beforeEach(() => {
    // Create a mock API client
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as any;

    contactService = new ContactService(mockApiClient);
  });

  it('should fetch contacts with filters', async () => {
    const mockContacts = [
      { id: '1', email: 'test@example.com', firstName: 'John' }
    ];
    
    vi.mocked(mockApiClient.get).mockResolvedValue({
      data: mockContacts,
      total: 1
    });

    const result = await contactService.getContacts({ status: 'active' });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/contacts',
      { params: { status: 'active' } }
    );
    expect(result.data).toEqual(mockContacts);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(mockApiClient.get).mockRejectedValue(
      new Error('Network error')
    );

    await expect(contactService.getContacts()).rejects.toThrow('Network error');
  });
});
```

## Component Testing Patterns

### Basic Component Test

```typescript
// src/components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

### Testing with Context and Providers

```typescript
// src/testing/utils/render-helpers.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="test-theme">
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
```

Using the custom render:

```typescript
// src/features/contacts/ContactList.test.tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/testing/utils/render-helpers';
import { ContactList } from './ContactList';

describe('ContactList', () => {
  it('should render contacts from API', async () => {
    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });
});
```

### Testing Forms

```typescript
// src/components/forms/ContactForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/testing/utils/render-helpers';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<ContactForm onSubmit={onSubmit} />);

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Submit
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });
  });

  it('should show validation errors for invalid email', async () => {
    const user = userEvent.setup();
    
    render(<ContactForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ContactForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
```

## Integration Testing with API Mocking

### MSW Setup

```typescript
// src/testing/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Get contacts
  http.get('/api/contacts', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    
    return HttpResponse.json({
      data: [
        { id: '1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
        { id: '2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
      ],
      total: 2,
      page: parseInt(page),
      pageSize: 10,
    });
  }),

  // Create contact
  http.post('/api/contacts', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: '3',
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Error scenarios
  http.get('/api/contacts/:id', ({ params }) => {
    if (params.id === 'error') {
      return HttpResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      id: params.id,
      email: 'test@example.com',
    });
  }),
];
```

```typescript
// src/testing/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/testing/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';
import '@testing-library/jest-dom/vitest';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

### Integration Test Example

```typescript
// src/tests/contact-workflow.test.ts
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/testing/utils/render-helpers';
import { ContactManagement } from '@/features/contacts/ContactManagement';

describe('Contact Management Workflow', () => {
  it('should create and display new contact', async () => {
    const user = userEvent.setup();
    
    render(<ContactManagement />);

    // Wait for initial contacts to load
    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    // Open create dialog
    await user.click(screen.getByRole('button', { name: /add contact/i }));

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'New');
    await user.type(screen.getByLabelText(/last name/i), 'User');

    // Submit
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Verify new contact appears in list
    await waitFor(() => {
      expect(screen.getByText('new@example.com')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const { server } = await import('@/testing/mocks/server');
    const { http, HttpResponse } = await import('msw');
    
    // Override handler to return error
    server.use(
      http.post('/api/contacts', () => {
        return HttpResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      })
    );

    const user = userEvent.setup();
    render(<ContactManagement />);

    await user.click(screen.getByRole('button', { name: /add contact/i }));
    await user.type(screen.getByLabelText(/email/i), 'duplicate@example.com');
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});
```

## Testing with Dependency Injection

```typescript
// src/services/ContactService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { ContactService } from './ContactService';
import { ApiClient } from '../api/ApiClient';
import { TYPES } from '@/platform/di/types';

describe('ContactService with DI', () => {
  let container: Container;
  let contactService: ContactService;

  beforeEach(() => {
    container = new Container();
    
    // Register mock dependencies
    container.bind<ApiClient>(TYPES.ApiClient).toConstantValue({
      get: vi.fn().mockResolvedValue({ data: [] }),
    } as any);
    
    container.bind<ContactService>(TYPES.ContactService).to(ContactService);
    
    contactService = container.get<ContactService>(TYPES.ContactService);
  });

  it('should inject dependencies correctly', async () => {
    const result = await contactService.getContacts();
    expect(result).toBeDefined();
  });
});
```

## Accessibility Testing

```typescript
// src/components/ContactCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@/testing/utils/render-helpers';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ContactCard } from './ContactCard';

expect.extend(toHaveNoViolations);

describe('ContactCard Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ContactCard 
        contact={{ 
          id: '1', 
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }} 
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<ContactCard contact={{ id: '1', email: 'test@example.com' }} />);

    // Tab to focus element
    await user.tab();
    
    // Verify focus
    expect(screen.getByRole('button', { name: /view details/i })).toHaveFocus();
  });
});
```

## Testing Hooks

```typescript
// src/hooks/useDebounce.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed', delay: 500 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('changed');
    });
  });
});
```

## Snapshot Testing (Use Sparingly)

```typescript
// src/components/ContactCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@/testing/utils/render-helpers';
import { ContactCard } from './ContactCard';

describe('ContactCard Snapshots', () => {
  it('should match snapshot for standard contact', () => {
    const { container } = render(
      <ContactCard 
        contact={{ 
          id: '1', 
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }} 
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
```

**Note**: Only use snapshots for stable components like icons or complex layouts. Prefer behavioral tests for interactive components.

## Test Data Builders

```typescript
// src/testing/utils/builders/contactBuilder.ts
import type { Contact } from '@/models/Contact';

export class ContactBuilder {
  private contact: Partial<Contact> = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  withEmail(email: string): this {
    this.contact.email = email;
    return this;
  }

  withName(firstName: string, lastName: string): this {
    this.contact.firstName = firstName;
    this.contact.lastName = lastName;
    return this;
  }

  withStatus(status: Contact['status']): this {
    this.contact.status = status;
    return this;
  }

  build(): Contact {
    return this.contact as Contact;
  }
}

// Usage in tests
const contact = new ContactBuilder()
  .withEmail('jane@example.com')
  .withName('Jane', 'Smith')
  .withStatus('inactive')
  .build();
```

## Performance Testing

```typescript
// src/components/ContactList.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@/testing/utils/render-helpers';
import { ContactList } from './ContactList';

describe('ContactList Performance', () => {
  it('should render large list efficiently', () => {
    const contacts = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      email: `user${i}@example.com`,
      firstName: `User`,
      lastName: `${i}`,
    }));

    const startTime = performance.now();
    
    render(<ContactList contacts={contacts} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 1 second
    expect(renderTime).toBeLessThan(1000);
  });
});
```

## Best Practices

### DO ✅

- Test user behavior, not implementation details
- Use accessible queries (`getByRole`, `getByLabelText`)
- Colocate tests with source files
- Mock external dependencies (APIs, services)
- Test error states and edge cases
- Use `userEvent` instead of `fireEvent` for more realistic interactions
- Write descriptive test names that explain the scenario

### DON'T ❌

- Test internal component state directly
- Use `getByTestId` unless absolutely necessary
- Commit commented-out tests
- Test third-party library code
- Over-rely on snapshot tests
- Mock React itself
- Write tests that depend on each other

## Related Documentation

- [Testing Strategy](../../overview/client/testing-strategy.md) - High-level testing approach
- [Testing Conventions](../../conventions/testing-conventions.md) - Team standards and naming
- [Feature Development Pattern](./feature-development-pattern.md) - Feature architecture

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team
