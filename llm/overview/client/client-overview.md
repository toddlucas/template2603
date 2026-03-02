# Client Overview

## Project Purpose

> **Note**: This document describes the **product application client** (React + Vite) located in `src/client/`. The marketing website (Next.js) is documented separately in [Website Overview](../website/website-overview.md).

## Core Domain: Customer Engagement Platform

## Architecture Overview

The client follows a **modular architecture** with clear separation of concerns:

```
┌─────────────────┐
│   Applications  │  Web App, Admin, Shared Library
├─────────────────┤
│   Features      │  Auth, Explorer, Dashboard, Theme
├─────────────────┤
│   Platform      │  DI, Events, Config, Logging
├─────────────────┤
│   Components    │  UI Components, Forms, Tables
└─────────────────┘
```

## Project Structure

### **Core Applications**

#### **common** (Shared Library)
- **Purpose**: Common components, utilities, and services
- **Features**: Reusable UI components, API clients, state management
- **Testing**: Vitest with comprehensive test coverage

### **Technology Stack**

#### **Core Technologies**
- **React 19.1.0**: Modern React with latest features
- **TypeScript 5.8.3**: Type-safe development
- **Vite 6.3.5**: Fast build tool and dev server
- **Tailwind CSS 4.1.5**: Utility-first styling

#### **UI Components**
- **shadcn/ui**: Headless UI components built on Radix UI primitives
- **Style**: New York variant with CSS variables
- **Icon Library**: Lucide React for consistent iconography
- **Component Location**: 
  - `common/src/components/ui/`: Shared shadcn components (button, input, card, etc.)
  - `common/src/components/`: Custom shared components (forms, tables, etc.)
  - App-specific components can be added to `admin/` or `web/` when needed
- **Customization**: Components are copied into the project and fully customizable
- **Accessibility**: Built-in WCAG compliance via Radix UI primitives

#### **State Management**
- **Zustand 5.0.4**: Lightweight state management
- **Dependency Injection**: Inversify-based DI container
- **Event System**: Custom event bus for component communication

#### **Development Tools**
- **Vitest 3.1.3**: Fast unit testing
- **Testing Library**: Component testing utilities
- **ESLint 9.25.0**: Code linting
- **Prettier 3.5.3**: Code formatting

## Key Features

### **User Interface**
- **Responsive Design**: Mobile-first responsive layout
- **Modern UI**: Clean, intuitive interface with shadcn/ui components and Tailwind CSS
- **Accessibility**: WCAG-compliant components via Radix UI primitives
- **Theme Support**: Light/dark theme switching with CSS variables

## Architecture Components

### **Dependency Injection System**
- **Framework**: Inversify-based DI container
- **Pattern**: Constructor injection with `@injectable()` decorator
- **Configuration**: Type symbols defined in `src/client/common/src/platform/di/types.ts`
- **Scopes**: Singleton and transient scope management
- **Benefits**: Clean separation of concerns and testability

### **Event System**
- **Event Store**: In-memory event storage
- **Event Bus**: Component communication
- **Event Types**: Platform events for cross-component communication

### **Configuration Management**
- **Environment-based**: Development, staging, production configs
- **Type-safe**: TypeScript interfaces for configuration
- **API Integration**: Automatic API endpoint configuration

## Feature Modules

### **Authentication (`src/client/common/src/features/auth`)**
- **Login/Register**: User authentication flows
- **Account Management**: Password changes, 2FA, personal data
- **Session Management**: Token validation and refresh
- **Views**: 20+ authentication-related views

### **Theme (`src/client/common/src/features/theme`)**
- **Theme Switching**: Light/dark mode support
- **Customization**: User preference management

## Component Architecture

### **Platform Components (`src/client/common/src/platform`)**
- **Dependency Injection**: Container management
- **Event System**: Cross-component communication
- **Configuration**: Environment and settings management
- **Logging**: Structured logging with levels

## State Management

### **Zustand Stores**
- **Auth Store**: Authentication and user state
- **Theme Store**: UI theme and preferences

### **Store Features**
- **Type Safety**: Full TypeScript support
- **Persistence**: Local storage integration
- **Actions**: Synchronous and asynchronous operations
- **Subscriptions**: Reactive state updates

## API Integration

### **API Client (`src/client/common/src/api`)**
- **HTTP Client**: Simple wrapper library for HTTP requests
- **Error Handling**: Centralized error management
- **Authentication**: Token-based auth integration
- **Type Safety**: Auto-generated TypeScript types

### **Model Types (`src/client/common/src/models`)**
- **Domain Models**: Exported from server
- **Auth Models**: User, token, authentication types
- **Pagination**: Paged results and queries
- **Validation**: Form validation schemas

## Development Workflow

### **Local Development**
1. **Main App**: `src/client/web` runs on port 8383
2. **Admin App**: `src/client/admin` runs on port 8484
1. **Electron App**: `src/client/app` runs on port 8585
3. **Shared Library**: `src/client/common` provides common components
4. **Hot Reload**: Vite provides instant updates

### **Testing Strategy**
- **Unit Tests**: Utilities, hooks, and services
- **Component Tests**: React components with Testing Library
- **Integration Tests**: Feature workflows
- **Coverage**: Comprehensive test coverage reporting

### **Build Process**
- **TypeScript Compilation**: Type-safe builds
- **Asset Optimization**: Vite-based optimization
- **Environment Configs**: Development, staging, production
- **Source Maps**: Debug-friendly builds

## Port Configuration
- **Main App**: 8383 (web app)
- **Admin App**: 8484 (system administration)
- **API Server**: 8181 (backend API)
- **Background Jobs**: Hangfire dashboard

## Development Guidelines

### **Code Standards**
- Use TypeScript for all new code
- Follow established project structure
- Write tests for new components and features
- Use Tailwind CSS for styling
- Follow ESLint and Prettier configurations

### **Architecture Patterns**
- Use Dependency Injection for all services
- Keep components modular and reusable
- Use Zustand for state management
- Document complex logic and components
- Minimize use of `any` in TypeScript

### **Testing Preferences**
- Don't put tests in `__tests__` directories
- Use `.test.ts` extension alongside subject files
- Don't remove special comments (REVIEW, TODO, BUGBUG, NOTE)
- Don't use `I` prefix for interfaces

## Modular App Architecture

The web client supports a modular architecture where multiple applications can coexist:
- **Cloud** (main app): Documents, Changesets
- **Mail Infrastructure** (POC): Domains, DNS, Warmup management
- Future apps can be added easily

**See:** [Modular App Architecture](./apps/README.md) for full documentation.

## Additional Resources

### **Architecture & System Design**
- [Modular App Architecture](./apps/README.md): Multi-app system overview
- [Path Alias System](./apps/alias-system.md): Import path conventions (`$`, `@`, `#app`)
- [Platform Events System](./platform-events-system.md): Cross-component communication
- [Debug Logging](./debug-logging.md): Structured logging system

### **Development Guides**
- [Client Feature Template](../../patterns/client/client-feature-template.md): Comprehensive feature template with i18n
- [App Template](../../patterns/client/client-app.md): Creating new modular apps
- [API Client Pattern](../../patterns/client/api-client-pattern.md): HTTP requests and Result type handling
- [UI Components Pattern](../../patterns/client/ui-components-pattern.md): Using and customizing shadcn/ui components
- [Modular Zustand Store Pattern](../../patterns/client/modular-zustand-store-pattern.md): State management patterns
- [i18n Localization Pattern](../../patterns/client/i18n-localization-pattern.md): Internationalization
