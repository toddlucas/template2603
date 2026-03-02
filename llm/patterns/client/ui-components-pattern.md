# UI Components Pattern

## Overview

This document describes the patterns and practices for using and customizing UI components in the client applications. We use **shadcn/ui** as our primary component library, which provides accessible, customizable components built on Radix UI primitives.

## Core Principles

1. **Accessibility First**: All components must be WCAG 2.1 AA compliant
2. **Consistency**: Use existing components before creating new ones
3. **Customization**: Components are owned by the project and can be modified
4. **Shared by Default**: Place components in `common` unless there's a specific reason not to
5. **Composition**: Build complex components from simpler ones
6. **Encapsulation**: Wrap complex Tailwind patterns in reusable components

## Quick Reference

### When to Create a Component

| Scenario | Action |
|----------|--------|
| Pattern repeats 2+ times | ✅ Create component |
| 5+ Tailwind classes together | ✅ Create component |
| Semantic UI concept (PageHeader, StatusBadge) | ✅ Create component |
| One-off simple layout (1-3 classes) | ✅ Use inline classes |
| Contextual spacing adjustment | ✅ Use inline classes |

### Component Placement

| Type | Location |
|------|----------|
| shadcn/ui components | `common/src/components/ui/` |
| Shared general components | `common/src/components/` |
| Shared feature components | `common/src/features/*/components/` |
| Web-only feature components | `web/src/features/*/components/` |
| Admin-only feature components | `admin/src/features/*/components/` |
| Web-only general components | `web/src/components/` |
| Admin-only general components | `admin/src/components/` |

### Styling Decision Flow

```
See Tailwind classes needed →
  ├─ 1-3 simple classes → Use inline
  └─ 5+ classes OR repeated pattern → Create component
      ├─ shadcn has it → Use/wrap shadcn
      └─ Custom pattern → Create new component
```

## Component Architecture

### Component Locations

```
src/client/
├── common/src/
│   ├── components/                 # Shared general components
│   │   ├── ui/                     # shadcn/ui components (installed via CLI)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── form/                   # Custom form components
│   │   │   ├── EmailInput.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   └── TextInput.tsx
│   │   ├── tables/                 # Custom table components
│   │   │   ├── Paginator.tsx
│   │   │   └── PageSizeSelector.tsx
│   │   └── ...                     # Other custom components
│   └── features/                   # Shared features (used across apps)
│       ├── auth/components/
│       ├── contacts/components/
│       └── sequences/components/
├── admin/src/
│   ├── components/                 # Admin-only general components
│   └── features/                   # Admin-only features (rare)
└── web/src/
    ├── components/                 # Web-only general components
    └── features/                   # Web-only features (rare)
```

### Component Categories

#### **1. shadcn/ui Components** (`common/src/components/ui/`)
- Pre-built, accessible components from shadcn/ui
- Installed via CLI: `npx shadcn@latest add <component-name>`
- Fully customizable after installation
- Examples: Button, Input, Card, Select, Dialog, etc.

#### **2. Custom Shared Components** (`common/src/components/`)
- Built for project-specific needs
- Composed from shadcn/ui components
- Shared across all applications
- Examples: EmailInput, Paginator, ErrorBoundary

#### **3. Feature Components**
- Feature-specific UI components
- May use shadcn/ui and custom shared components
- **Shared features**: `common/src/features/*/components/` (used across web and admin)
- **Web-only features**: `web/src/features/*/components/` (only in web app)
- **Admin-only features**: `admin/src/features/*/components/` (only in admin app)
- Examples: ChatInterface, SequenceBuilder, ContactCard
- **Default**: Place features in `common` unless there's a clear reason they're app-specific

#### **4. App-Specific Components** (`admin/src/components/`, `web/src/components/`)
- General components only used in one application (not part of a feature)
- Should be rare - prefer shared components or feature-specific organization
- Examples: AdminDashboard, UserProfileWidget

## shadcn/ui Configuration

### Configuration File

Located at: `common/components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "$/components",
    "utils": "$/utility/utils",
    "ui": "$/components/ui",
    "lib": "$/common",
    "hooks": "$/hooks"
  }
}
```

### Key Configuration Details

- **Style**: `new-york` - More modern, polished appearance
- **Base Color**: `neutral` - Gray-based color scheme
- **CSS Variables**: Enabled for theme customization
- **Icon Library**: Lucide React for consistent, high-quality icons
- **Path Aliases**: Use `$/components/ui/*` to import shadcn components

## Installing shadcn Components

### Installation Process

1. **Navigate to the common directory:**
   ```bash
   cd main/src/client/common
   ```

2. **Install a component:**
   ```bash
   npx shadcn@latest add button
   ```

3. **Install multiple components:**
   ```bash
   npx shadcn@latest add button input label card
   ```

4. **View available components:**
   ```bash
   npx shadcn@latest add
   ```
   (Interactive mode - select from list)

### Currently Installed Components

As of this writing, the following shadcn components are installed:

- `avatar` - User avatars and profile images
- `badge` - Status badges and tags
- `breadcrumb` - Navigation breadcrumbs
- `button` - Primary interactive element
- `card` - Content containers
- `collapsible` - Expandable content sections
- `dropdown-menu` - Dropdown menus and actions
- `input` - Text input fields
- `label` - Form labels
- `pagination` - Page navigation
- `select` - Dropdown selection
- `separator` - Visual dividers
- `sheet` - Side panels and drawers
- `sidebar` - Navigation sidebars
- `skeleton` - Loading placeholders
- `table` - Data tables
- `textarea` - Multi-line text input
- `tooltip` - Contextual help text

### When to Install New Components

Install a new shadcn component when:
- You need a common UI pattern (dialog, tabs, accordion, etc.)
- The component exists in shadcn/ui library
- You want accessibility built-in
- You need theme support automatically

Don't install shadcn components when:
- You need something highly specific to your domain
- The shadcn component doesn't match your needs at all
- You already have a custom component that works well

## Using Components

### Basic Usage

#### shadcn/ui Components

```typescript
import { Button } from '$/components/ui/button';
import { Input } from '$/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '$/components/ui/card';

export const LoginForm: React.FC = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

#### Custom Shared Components

```typescript
import { EmailInput } from '$/components/form/EmailInput';
import { PasswordInput } from '$/components/form/PasswordInput';
import { SubmitButton } from '$/components/form/SubmitButton';

export const EnhancedLoginForm: React.FC = () => {
  return (
    <form className="space-y-4">
      <EmailInput 
        name="email"
        label="Email Address"
        required
      />
      <PasswordInput
        name="password"
        label="Password"
        showStrength={false}
      />
      <SubmitButton>Sign In</SubmitButton>
    </form>
  );
};
```

### Component Composition

Build complex components by composing simpler ones:

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '$/components/ui/card';
import { Button } from '$/components/ui/button';
import { Badge } from '$/components/ui/badge';
import { Separator } from '$/components/ui/separator';
import { MailIcon, CalendarIcon } from 'lucide-react';

interface ContactCardProps {
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastContact?: Date;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  name,
  email,
  status,
  lastContact
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MailIcon className="h-4 w-4" />
          {email}
        </div>
        
        {lastContact && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              Last contact: {lastContact.toLocaleDateString()}
            </div>
          </>
        )}
        
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            Email
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Customizing Components

### When to Customize

Customize shadcn components when:
- You need different default styles
- You want to add project-specific variants
- You need to modify behavior slightly
- You want to add additional props

### Customization Methods

#### 1. Modify the Component File Directly

shadcn components are **copied** into your project, so you can edit them:

```typescript
// common/src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "$/utility/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // CUSTOM: Add project-specific variant
        success: "bg-green-600 text-white shadow hover:bg-green-700",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ... rest of component unchanged
```

#### 2. Create a Wrapper Component

For more complex customizations, create a wrapper:

```typescript
// common/src/components/SubmitButton.tsx
import { Button } from '$/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import React from 'react';

interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  isSubmitting?: boolean;
  loadingText?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting = false,
  loadingText = 'Submitting...',
  children,
  disabled,
  ...props
}) => {
  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      {...props}
    >
      {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin" />}
      {isSubmitting ? loadingText : children}
    </Button>
  );
};
```

#### 3. Use className for One-off Styles

For simple styling changes:

```typescript
<Button 
  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
>
  Gradient Button
</Button>
```

### Component Variants

Most shadcn components use **class-variance-authority (cva)** for variants:

```typescript
// Example: Using button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Example: Using sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><PlusIcon /></Button>

// Combining variants
<Button variant="outline" size="sm">Small Outline</Button>
```

## Theming and Styling

### CSS Variables

Theme colors are defined using CSS variables in `common/src/index.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... dark mode values */
  }
}
```

### Customizing Theme Colors

To customize the theme:

1. **Modify CSS variables** in `index.css`
2. **Use Tailwind classes** with theme values:
   ```typescript
   <div className="bg-primary text-primary-foreground">
     Uses theme colors
   </div>
   ```
3. **Theme-aware components** automatically adapt

### Dark Mode Support

All shadcn components support dark mode automatically via CSS variables:

```typescript
import { ThemeProvider } from '$/components/theme-provider';
import { ModeToggle } from '$/components/mode-toggle';

export const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        <header>
          <ModeToggle />
        </header>
        {/* Your app content */}
      </div>
    </ThemeProvider>
  );
};
```

## Accessibility Guidelines

### Built-in Accessibility

shadcn/ui components provide:
- **Keyboard Navigation**: Tab, Arrow keys, Enter, Escape
- **Screen Reader Support**: ARIA labels and roles
- **Focus Management**: Proper focus trap and restoration
- **Color Contrast**: WCAG AA compliant colors

### Accessibility Checklist

When creating or customizing components:

- [ ] **Keyboard accessible**: All interactive elements work with keyboard
- [ ] **Focus indicators**: Visible focus states for all interactive elements
- [ ] **ARIA labels**: Meaningful labels for screen readers
- [ ] **Color contrast**: Text has 4.5:1 contrast ratio (AA standard)
- [ ] **Alt text**: Images have descriptive alt text
- [ ] **Form labels**: All inputs have associated labels
- [ ] **Error messages**: Clear, accessible error states
- [ ] **Loading states**: Announce loading states to screen readers

### Example: Accessible Form

```typescript
import { Label } from '$/components/ui/label';
import { Input } from '$/components/ui/input';
import { Button } from '$/components/ui/button';

export const AccessibleForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      
      <Button type="submit">
        Submit
      </Button>
    </form>
  );
};
```

## Icons

### Lucide React

We use **Lucide React** for icons:

```typescript
import { 
  MailIcon, 
  UserIcon, 
  SettingsIcon,
  ChevronDownIcon 
} from 'lucide-react';

export const IconExample: React.FC = () => {
  return (
    <div className="flex gap-4">
      <MailIcon className="h-6 w-6" />
      <UserIcon className="h-6 w-6 text-primary" />
      <SettingsIcon className="h-6 w-6 text-muted-foreground" />
      <ChevronDownIcon className="h-4 w-4" />
    </div>
  );
};
```

### Icon Guidelines

- **Size**: Use h-4 w-4 (16px) or h-6 w-6 (24px) for most icons
- **Color**: Use text utilities: `text-primary`, `text-muted-foreground`
- **Buttons**: Icons automatically size correctly in buttons
- **Accessibility**: Add `aria-label` if icon is the only content

```typescript
<Button size="icon" aria-label="Settings">
  <SettingsIcon className="h-4 w-4" />
</Button>
```

## Component Testing

### Unit Testing Components

Test components using Vitest and Testing Library:

```typescript
// ContactCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContactCard } from './ContactCard';

describe('ContactCard', () => {
  it('renders contact information', () => {
    render(
      <ContactCard
        name="John Doe"
        email="john@example.com"
        status="active"
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('displays last contact date when provided', () => {
    const lastContact = new Date('2024-01-15');
    
    render(
      <ContactCard
        name="John Doe"
        email="john@example.com"
        status="active"
        lastContact={lastContact}
      />
    );

    expect(screen.getByText(/Last contact:/)).toBeInTheDocument();
  });
});
```

### Accessibility Testing

Test keyboard navigation and screen reader support:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

describe('Button accessibility', () => {
  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    
    render(<Button onClick={onClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    
    // Focus with tab
    await user.tab();
    expect(button).toHaveFocus();
    
    // Activate with space
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(1);
    
    // Activate with enter
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
```

## Styling Strategy

### Principle: Encapsulate Tailwind Classes in Components

**Core Philosophy**: While Tailwind encourages utility classes directly in JSX, we prefer to **encapsulate complex styling within reusable components**. This keeps your application code clean and maintainable.

### When to Encapsulate vs Inline

#### ✅ Encapsulate (Create a Component)

Create a reusable component when:
- The same style pattern repeats 2+ times
- The styling is complex (5+ Tailwind classes)
- The styling represents a semantic UI concept
- You want to enforce consistency across the app

```typescript
// ✅ GOOD: Encapsulated in a component
// src/client/common/src/components/PageHeader.tsx
import { ReactNode } from 'react';
import { cn } from '$/utility/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
};

// Usage in your app (clean!)
<PageHeader 
  title="Contacts" 
  subtitle="Manage your contact list"
  actions={<Button>Add Contact</Button>}
/>
```

```typescript
// ❌ BAD: Inline classes everywhere (repeated pattern)
// ContactsPage.tsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
    <p className="text-muted-foreground mt-2">Manage your contact list</p>
  </div>
  <div className="flex gap-2">
    <Button>Add Contact</Button>
  </div>
</div>

// SequencesPage.tsx (same pattern repeated)
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Sequences</h1>
    <p className="text-muted-foreground mt-2">Manage your sequences</p>
  </div>
  <div className="flex gap-2">
    <Button>Create Sequence</Button>
  </div>
</div>
```

#### ✅ Inline Classes (Keep Simple)

Use inline Tailwind classes when:
- It's a one-off layout adjustment
- The styling is simple (1-3 classes)
- It's within a component you've already created
- It's for spacing/layout that's specific to the context

```typescript
// ✅ GOOD: Simple, contextual styling
<PageHeader title="Contacts">
  <div className="space-y-4">  {/* Simple spacing */}
    <ContactList contacts={contacts} />
    <Pagination />
  </div>
</PageHeader>

// ✅ GOOD: One-off layout
<Card className="max-w-md mx-auto">
  <ContactForm />
</Card>
```

### Preferred Pattern: Wrap shadcn Components

When you need custom styling on shadcn components, prefer creating wrapper components over inline customization:

```typescript
// ✅ EXCELLENT: Wrapper component encapsulates styling
// src/client/common/src/components/PrimaryActionButton.tsx
import { Button } from '$/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { cn } from '$/utility/utils';

interface PrimaryActionButtonProps extends React.ComponentProps<typeof Button> {
  icon?: boolean;
}

export const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  children,
  icon = true,
  className,
  ...props
}) => {
  return (
    <Button
      size="lg"
      className={cn(
        "bg-gradient-to-r from-blue-600 to-purple-600",
        "hover:from-blue-700 hover:to-purple-700",
        "shadow-lg hover:shadow-xl transition-all",
        className
      )}
      {...props}
    >
      {children}
      {icon && <ArrowRightIcon className="h-4 w-4" />}
    </Button>
  );
};

// Usage is clean
<PrimaryActionButton onClick={handleStart}>
  Get Started
</PrimaryActionButton>
```

```typescript
// ❌ BAD: Inline styling repeated everywhere
<Button 
  size="lg"
  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
  onClick={handleStart}
>
  Get Started
  <ArrowRightIcon className="h-4 w-4" />
</Button>

// Same pattern repeated in 10 other places...
```

### Guidelines for Component Creation

#### When to Create a Component

Ask yourself:
1. **Will I use this exact pattern again?** → Create component
2. **Does this represent a reusable UI concept?** → Create component
3. **Is the Tailwind class list getting long?** (5+ classes) → Create component
4. **Would a designer name this pattern?** → Create component

#### Examples of Good Component Candidates

```typescript
// Status badges
<StatusBadge status="active" />
<StatusBadge status="error" />

// Section headers
<SectionHeader title="Details" description="Contact information" />

// Empty states
<EmptyState 
  icon={<InboxIcon />}
  title="No contacts"
  description="Add your first contact to get started"
  action={<Button>Add Contact</Button>}
/>

// Form sections
<FormSection title="Personal Information">
  <EmailInput />
  <TextInput />
</FormSection>

// Stats cards
<StatCard label="Total Contacts" value={1234} trend={+5.2} />
```

### Styling Hierarchy

Follow this hierarchy for styling decisions:

```
1. Use existing shadcn component
   └─ If styling needed →
      2. Create wrapper component
         └─ If very app-specific →
            3. Use inline classes sparingly
```

**Never**: Repeat complex Tailwind patterns in multiple places.

### Real-World Example

```typescript
// ❌ BAD: Tailwind classes everywhere
export const ContactsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-2">Manage your contact list</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Import</Button>
          <Button>Add Contact</Button>
        </div>
      </div>
      
      <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="text-xl font-semibold">All Contacts</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <InboxIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first contact</p>
              <Button onClick={onAdd}>Add Contact</Button>
            </div>
          ) : (
            <ContactList contacts={contacts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

```typescript
// ✅ GOOD: Encapsulated components
export const ContactsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader 
        title="Contacts"
        subtitle="Manage your contact list"
        actions={
          <>
            <Button variant="outline">Import</Button>
            <Button>Add Contact</Button>
          </>
        }
      />
      
      <DataCard title="All Contacts">
        {contacts.length === 0 ? (
          <EmptyState
            icon={<InboxIcon />}
            title="No contacts yet"
            description="Get started by adding your first contact"
            action={<Button onClick={onAdd}>Add Contact</Button>}
          />
        ) : (
          <ContactList contacts={contacts} />
        )}
      </DataCard>
    </PageContainer>
  );
};
```

### Benefits of This Approach

1. **Maintainability**: Change styling in one place
2. **Consistency**: Same component = same appearance
3. **Readability**: Business logic isn't obscured by Tailwind classes
4. **Testability**: Easier to test semantic components
5. **Refactoring**: Easy to adjust spacing, colors, etc.
6. **Designer-friendly**: Component names match design system vocabulary

## Best Practices

### 1. Component Organization

```
✅ DO: Organize by feature/domain
src/client/common/src/features/contacts/components/
  ├── ContactCard.tsx
  ├── ContactList.tsx
  └── ContactForm.tsx

❌ DON'T: Organize by component type
src/client/common/src/components/
  ├── cards/ContactCard.tsx
  ├── lists/ContactList.tsx
  └── forms/ContactForm.tsx
```

### 2. Component Naming

```typescript
✅ DO: Use descriptive, specific names
export const ContactCard: React.FC<ContactCardProps> = ...
export const SequenceStepEditor: React.FC<SequenceStepEditorProps> = ...

❌ DON'T: Use generic names
export const Card: React.FC<CardProps> = ...  // Conflicts with shadcn Card
export const Editor: React.FC<EditorProps> = ...  // Too vague
```

### 3. Props Design

```typescript
✅ DO: Use discriminated unions for variants
type ButtonProps = 
  | { variant: 'submit'; isSubmitting: boolean }
  | { variant: 'link'; href: string }
  | { variant: 'default' };

✅ DO: Extend existing component props
interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  isSubmitting?: boolean;
}

❌ DON'T: Duplicate all props manually
interface SubmitButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  // ... etc (fragile, incomplete)
}
```

### 4. Styling Patterns

**Key Principle**: Encapsulate complex styling in components (see [Styling Strategy](#styling-strategy))

```typescript
✅ DO: Encapsulate repeated patterns in components
// Create PageContainer component instead of repeating classes
export const PageContainer: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="container mx-auto px-4 py-8">{children}</div>
);

✅ DO: Use cn() utility for conditional classes in components
import { cn } from '$/utility/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className  // Always allow className override
)} />

✅ DO: Simple inline classes for one-off layout adjustments
<Card className="max-w-md mx-auto" />

❌ DON'T: Repeat complex Tailwind patterns
// Bad: Same 5+ classes in multiple places
<div className="flex items-center justify-between mb-8 border-b pb-4">
  {/* ... */}
</div>

❌ DON'T: Use inline styles unless necessary
<div style={{ width: '100%', maxWidth: '448px' }} />
```

### 5. Component Composition

```typescript
✅ DO: Build complex components from simple ones
export const ContactForm = () => (
  <Card>
    <CardHeader>
      <CardTitle>Add Contact</CardTitle>
    </CardHeader>
    <CardContent>
      <EmailInput />
      <TextInput />
      <SubmitButton />
    </CardContent>
  </Card>
);

❌ DON'T: Create monolithic components
export const ContactForm = () => (
  <div className="rounded border p-4">
    <h2>Add Contact</h2>
    <div>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" />
      {/* 100+ lines of form fields... */}
    </div>
  </div>
);
```

## Common Patterns

### Loading States

```typescript
import { Button } from '$/components/ui/button';
import { Skeleton } from '$/components/ui/skeleton';
import { Loader2Icon } from 'lucide-react';

// Button loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// Content loading skeleton
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  <ContactList contacts={contacts} />
)}
```

### Error States

```typescript
import { Alert, AlertDescription, AlertTitle } from '$/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';

{error && (
  <Alert variant="destructive">
    <AlertCircleIcon className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

### Empty States

**Prefer**: Create an `EmptyState` component for reusability

```typescript
// ✅ BEST: Encapsulated EmptyState component
// common/src/components/EmptyState.tsx
import { Card, CardContent } from '$/components/ui/card';
import { Button } from '$/components/ui/button';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-muted-foreground mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground mb-4">{description}</p>
        )}
        {action}
      </CardContent>
    </Card>
  );
};

// Usage (clean!)
import { InboxIcon } from 'lucide-react';

{contacts.length === 0 && (
  <EmptyState
    icon={<InboxIcon className="h-12 w-12" />}
    title="No contacts yet"
    description="Get started by adding your first contact"
    action={<Button onClick={onAddContact}>Add Contact</Button>}
  />
)}
```

### Form Patterns

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '$/components/ui/form';
import { Input } from '$/components/ui/input';
import { Button } from '$/components/ui/button';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const ContactForm: React.FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Handle form submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>The contact's full name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Contact'}
        </Button>
      </form>
    </Form>
  );
};
```

## Decision Tree

### Should I use a shadcn component?

```
Do you need this UI pattern?
  │
  ├─ Yes → Does shadcn have this component?
  │   │
  │   ├─ Yes → Does it meet your needs?
  │   │   │
  │   │   ├─ Yes → ✅ Use shadcn component
  │   │   │
  │   │   └─ Mostly → ✅ Use shadcn, customize as needed
  │   │
  │   └─ No → Does a custom component exist?
  │       │
  │       ├─ Yes → ✅ Use custom component
  │       │
  │       └─ No → ✅ Build custom component
  │
  └─ No → ❌ Don't create the component
```

### Where should I put this component?

```
Is it feature-specific?
  │
  ├─ Yes → Is the feature used across multiple apps?
  │   │
  │   ├─ Yes → Put in common/src/features/*/components/
  │   │
  │   └─ No → Is it web or admin only?
  │       │
  │       ├─ Web only → Put in web/src/features/*/components/
  │       │
  │       └─ Admin only → Put in admin/src/features/*/components/
  │
  └─ No → Is it used across multiple apps?
      │
      ├─ Yes → Put in common/src/components/
      │
      └─ No → Is it web or admin specific?
          │
          ├─ Web only → Put in web/src/components/
          │
          └─ Admin only → Put in admin/src/components/
```

## Migration Guide

### Migrating Existing Components to shadcn

If you have custom components that could use shadcn:

1. **Identify shadcn equivalent**: Check if shadcn has a similar component
2. **Install shadcn component**: `npx shadcn@latest add <component>`
3. **Create wrapper if needed**: Wrap shadcn component with your custom logic
4. **Update imports**: Replace old component imports with new ones
5. **Test thoroughly**: Ensure functionality and accessibility are maintained
6. **Remove old component**: Delete the old component file

### Example Migration

```typescript
// Before: Custom button
// common/src/components/CustomButton.tsx
export const CustomButton: React.FC<Props> = ({ children, loading, ...props }) => {
  return (
    <button 
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

// After: shadcn button with wrapper
// common/src/components/LoadingButton.tsx
import { Button } from '$/components/ui/button';
import { Loader2Icon } from 'lucide-react';

export const LoadingButton: React.FC<Props> = ({ children, loading, ...props }) => {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
      {loading ? 'Loading...' : children}
    </Button>
  );
};
```

## Troubleshooting

### Common Issues

#### Issue: Component not styled correctly

**Solution**: Ensure Tailwind CSS is configured and `index.css` is imported

```typescript
// main.tsx or App.tsx
import './index.css';  // Must import this!
```

#### Issue: Icons not showing

**Solution**: Install and import from lucide-react

```bash
npm install lucide-react
```

```typescript
import { MailIcon } from 'lucide-react';  // ✅ Correct
import { Mail } from 'lucide-react';      // ✅ Also works
```

#### Issue: Dark mode not working

**Solution**: Ensure ThemeProvider wraps your app

```typescript
import { ThemeProvider } from '$/components/theme-provider';

<ThemeProvider defaultTheme="system" storageKey="ui-theme">
  <App />
</ThemeProvider>
```

#### Issue: Type errors with component props

**Solution**: Use `React.ComponentProps<typeof Component>` for type-safe extension

```typescript
import { Button } from '$/components/ui/button';

interface CustomButtonProps extends React.ComponentProps<typeof Button> {
  customProp?: string;
}
```

## Resources

### Official Documentation
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

### Internal Documentation
- [Client Overview](../../overview/client/client-overview.md)
- [Feature Development Pattern](./feature-development-pattern.md)
- [Modular Zustand Store Pattern](./modular-zustand-store-pattern.md)

### Additional Resources
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM: Web Accessibility](https://webaim.org/)
- [React Testing Library](https://testing-library.com/react)

