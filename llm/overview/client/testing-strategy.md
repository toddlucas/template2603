# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Product Name client applications. It defines what we test, how we test it, and the quality standards we maintain across the codebase.

## Testing Philosophy

Our testing approach follows these core principles:

1. **User-Centric Testing**: Test behavior users experience, not implementation details
2. **Appropriate Coverage**: Right tests at the right level (unit, component, integration, E2E)
3. **Fast Feedback**: Tests should run quickly and provide clear failure messages
4. **Maintainability**: Tests should be easy to update as the product evolves
5. **Confidence**: Tests should give us confidence to ship changes rapidly

## Testing Pyramid

We follow a modified testing pyramid that balances speed, confidence, and maintenance cost:

```
        ╱╲
       ╱  ╲
      ╱E2E ╲          ~10% - Critical user paths
     ╱──────╲
    ╱  Inte- ╲        ~20% - Feature workflows
   ╱  gration ╲
  ╱────────────╲
 ╱ Component &  ╲     ~70% - Components & business logic
╱  Unit Tests    ╲
──────────────────
```

### Unit Tests (70%)

**What**: Pure functions, utilities, services, API clients

**Why**: Fast execution, precise failure isolation, test edge cases thoroughly

**Tools**: Vitest

**Examples**:
- `formatPhoneNumber()` function
- `ContactService.validateEmail()`
- JWT token parsing utilities
- Date formatting functions

**Coverage Target**: 90%+ for business logic, 100% for validators

### Component Tests (included in 70%)

**What**: React components in isolation with mocked dependencies

**Why**: Test user interactions and visual behavior without browser overhead

**Tools**: Vitest + React Testing Library

**Examples**:
- Form validation and submission
- Button click handlers
- Conditional rendering based on props
- Accessibility features

**Coverage Target**: 80%+ for UI components

### Integration Tests (20%)

**What**: Multiple components working together, API interactions, state management

**Why**: Verify features work end-to-end without full browser

**Tools**: Vitest + React Testing Library + MSW (Mock Service Worker)

**Examples**:
- User creates a contact and sees it in the list
- Authentication flow from login to dashboard
- Multi-step form wizard
- Error handling across component boundaries

**Coverage Target**: All critical user flows

### End-to-End Tests (10%)

**What**: Full user journeys in real browsers

**Why**: Final verification that everything works together in production-like environment

**Tools**: Playwright

**Examples**:
- Complete login → create contact → edit → delete flow
- Sequence builder with all steps
- Cross-browser compatibility
- Mobile responsive behavior

**Coverage Target**: P0 user stories (highest priority features)

## Test Organization

### Directory Structure

```
src/client/
├── common/
│   └── src/
│       ├── testing/              # Shared test utilities
│       │   ├── setup.ts
│       │   ├── utils/
│       │   └── mocks/
│       ├── tests/                # Integration tests
│       └── [feature]/
│           ├── Component.tsx
│           └── Component.test.tsx  # Colocated tests
│
├── web/
│   └── src/
│       ├── testing/              # App-specific utilities
│       ├── tests/                # App-level integration tests
│       └── views/
│           └── [view].test.tsx
│
└── e2e/                          # End-to-end tests
    ├── tests/
    │   ├── auth.spec.ts
    │   ├── contacts.spec.ts
    │   └── sequences.spec.ts
    └── playwright.config.ts
```

### Naming Conventions

- **Unit/Component Tests**: `*.test.ts` or `*.test.tsx` (colocated)
- **Integration Tests**: `*.test.ts` in `tests/` directories
- **E2E Tests**: `*.spec.ts` in `e2e/tests/`

See [Testing Conventions](../../conventions/testing-conventions.md) for detailed naming standards.

## Test Types by Layer

### Platform Layer

**What We Test**:
- Dependency injection container
- Configuration service
- Event bus and event handlers
- Logging service
- API clients and error handling

**Testing Approach**:
- Pure unit tests with mocked dependencies
- Integration tests for service interactions
- No UI testing at this layer

**Example**: Testing `EventBus` dispatches events to registered listeners

### Feature Layer

**What We Test**:
- Feature components and UI
- Feature-specific business logic
- API integration with mocked responses
- State management (stores)
- User workflows within the feature

**Testing Approach**:
- Component tests for individual UI elements
- Integration tests for complete feature workflows
- MSW for API mocking

**Example**: Testing contact creation form validates input, calls API, and updates list

### Application Layer

**What We Test**:
- Routing and navigation
- Authentication flows
- Layout and shell components
- Cross-feature workflows

**Testing Approach**:
- Integration tests spanning multiple features
- E2E tests for critical paths

**Example**: Testing user navigates from dashboard → contacts → create → back to list

## Coverage Goals

### Minimum Coverage Requirements

| Code Type | Target | Critical |
|-----------|--------|----------|
| Business Logic | 90% | 100% |
| Services | 85% | 95% |
| Components | 80% | 90% |
| Utilities | 95% | 100% |
| API Clients | 80% | 90% |

### What NOT to Test

- Third-party libraries (React, Tailwind, etc.)
- Auto-generated code
- Type definitions (TypeScript handles this)
- Simple pass-through components with no logic
- External APIs (mock them instead)

## Testing Practices

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
it('should create contact with valid data', async () => {
  // Arrange - Set up test data and mocks
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ContactForm onSubmit={onSubmit} />);

  // Act - Perform the user action
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /save/i }));

  // Assert - Verify the outcome
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com'
  });
});
```

### Query Priority (React Testing Library)

Use queries in this order of preference:

1. **Accessible queries** (best):
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`

2. **Semantic queries** (good):
   - `getByAltText`
   - `getByTitle`

3. **Test IDs** (last resort):
   - `getByTestId`

**Why**: Accessible queries ensure components work for screen readers and keyboard navigation.

### Mocking Strategy

**Mock External Dependencies**:
- ✅ API calls (use MSW)
- ✅ Browser APIs (`localStorage`, `navigator`)
- ✅ Third-party services (analytics, auth providers)
- ✅ Date/time (`vi.useFakeTimers()`)

**Don't Mock Internal Code**:
- ❌ Your own utilities and helpers
- ❌ React itself
- ❌ Components under test

### Async Testing

Always use proper async utilities:

```typescript
// ✅ Good - Proper async handling
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// ❌ Bad - Race condition
expect(screen.getByText('Success')).toBeInTheDocument();
```

### Error Testing

Test both happy paths and error scenarios:

```typescript
describe('ContactForm', () => {
  it('should submit successfully with valid data', async () => {
    // Test success case
  });

  it('should show validation errors for invalid email', async () => {
    // Test validation errors
  });

  it('should handle API errors gracefully', async () => {
    // Test API failure
  });

  it('should show network error message when offline', async () => {
    // Test network failure
  });
});
```

## Continuous Integration

### Pre-commit Checks

Run fast unit and component tests before commit:

```bash
npm run test:unit
npm run test:component
```

### Pull Request Checks

Run all tests except E2E:

```bash
npm run test:all     # Unit + Component + Integration
npm run lint
```

### Pre-deployment Checks

Run complete test suite including E2E:

```bash
npm run test:all
npm run test:e2e
npm run test:coverage
```

### Coverage Reporting

- Coverage reports generated automatically in CI
- Failed PR if coverage drops below minimum thresholds
- Coverage trends tracked over time

## E2E Testing with Playwright

### When to Write E2E Tests

Write E2E tests for:
- ✅ Critical business workflows (P0 user stories)
- ✅ Payment and checkout flows
- ✅ Multi-step forms and wizards
- ✅ Authentication and authorization
- ✅ Cross-browser compatibility needs

Skip E2E tests for:
- ❌ Simple CRUD operations (use integration tests)
- ❌ Individual component behavior (use component tests)
- ❌ Edge cases and error states (use unit tests)
- ❌ Visual styling (use visual regression tools)

### E2E Test Organization

```
e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts           # Single feature focus
│   │   └── logout.spec.ts
│   ├── contacts/
│   │   ├── contact-crud.spec.ts    # Complete CRUD workflow
│   │   └── bulk-import.spec.ts
│   └── sequences/
│       └── sequence-builder.spec.ts
├── fixtures/
│   ├── users.json                  # Test data
│   └── contacts.json
└── playwright.config.ts
```

### Cross-Browser Testing

Test matrix:
- **Desktop**: Chrome (latest), Firefox (latest), Safari (latest)
- **Mobile**: Chrome Mobile, Safari Mobile
- **Viewports**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

### E2E Best Practices

- Use page object pattern for reusability
- Keep tests independent (no shared state)
- Use test fixtures for data setup
- Run in parallel when possible
- Take screenshots on failure
- Record videos for debugging

## Accessibility Testing

### Automated Accessibility Tests

Include `jest-axe` in component tests:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<ContactForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Accessibility Testing

- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification
- Focus management

## Performance Testing

Monitor component render performance:

```typescript
it('should render large list efficiently', () => {
  const startTime = performance.now();
  
  render(<ContactList contacts={largeDataset} />);
  
  const renderTime = performance.now() - startTime;
  expect(renderTime).toBeLessThan(1000); // < 1 second
});
```

Use Playwright for real-world performance:
- Lighthouse CI integration
- Core Web Vitals tracking
- Bundle size monitoring

## Debugging Tests

### Running Tests in Watch Mode

```bash
npm run test:watch
```

Changes to source or test files automatically re-run affected tests.

### Running Single Test File

```bash
npm test -- ContactForm.test.tsx
```

### Running Single Test Case

```bash
npm test -- -t "should validate email"
```

### Playwright Debug Mode

```bash
npm run test:e2e:debug
```

Opens browser with step-by-step execution and time-travel debugging.

### VS Code Integration

Install the Vitest extension for:
- Inline test results
- Run/debug individual tests
- Coverage overlay

## Test Maintenance

### When Tests Break

1. **Understand why**: Don't blindly update snapshots
2. **Fix the test or the code**: Determine which is wrong
3. **Update test data**: Keep fixtures current with schema changes
4. **Refactor**: If many tests break from small changes, tests may be too brittle

### Refactoring Tests

- Extract common setup into helper functions
- Use test data builders for complex objects
- Create custom matchers for domain-specific assertions
- Share mock handlers across tests

### Removing Tests

Delete tests when:
- Feature is removed
- Test duplicates coverage from other tests
- Test has been flaky for extended period with no fix

## Related Documentation

- [Testing Patterns](../../patterns/client/testing-patterns.md) - Detailed technical patterns
- [Testing Conventions](../../conventions/testing-conventions.md) - Naming and style guide
- [Client Overview](./client-overview.md) - Overall architecture

## Resources

### Internal

- [Feature Development Pattern](../../patterns/client/feature-development-pattern.md)
- [UI Components Pattern](../../patterns/client/ui-components-pattern.md)

### External

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team
