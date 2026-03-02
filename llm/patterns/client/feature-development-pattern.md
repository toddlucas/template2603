# Feature Development Pattern

## Overview

This document describes the architectural pattern for developing independent features in the client while maintaining consistency with the existing platform architecture. Each feature is designed to be self-contained with its own test page, while leveraging shared platform services (DI, configuration, logging).

## Core Principles

1. **Independence**: Features should be self-contained and independently testable
2. **Platform Integration**: Leverage existing DI, configuration, and logging systems
3. **Testability**: Each feature has a dedicated test page for comprehensive testing
4. **Dashboard Integration**: Features are accessible via a unified dashboard
5. **Consistency**: Follow established patterns and conventions

## Directory Structure

### Feature Module Structure

Each feature follows this standardized structure within `src/client/common/src/features/`:

```
src/client/common/src/features/
├── auth/                    # Existing auth feature (reference)
├── ai-chat/                 # Example: AI chat feature
│   ├── api/
│   │   ├── aiChatApi.ts     # API client for the feature
│   │   └── types.ts         # API types and interfaces
│   ├── components/
│   │   ├── ChatInterface.tsx # Main feature component
│   │   ├── MessageList.tsx   # Sub-components
│   │   ├── ChatInput.tsx
│   │   └── ChatMessage.tsx
│   ├── stores/
│   │   └── aiChatStore.ts   # Feature state management
│   ├── views/
│   │   ├── AiChatPage.tsx   # Main feature page
│   │   └── AiChatTestPage.tsx # Comprehensive test page
│   ├── services/
│   │   └── AiChatService.ts # Feature business logic
│   └── di/
│       └── aiChatContainer.ts # DI registration
├── file-manager/            # Future file management feature
└── [other-features]/
```

### Key Directories Explained

- **`api/`**: API client code and type definitions
- **`components/`**: Reusable React components specific to the feature
- **`stores/`**: State management (Zustand stores)
- **`views/`**: Page-level components including test pages
- **`services/`**: Business logic and service layer
- **`di/`**: Dependency injection registration (optional)

## Feature Development Process

### 1. Create Feature Structure

Start by creating the directory structure for your feature:

```bash
mkdir -p src/client/common/src/features/your-feature/{api,components,stores,views,services,di}
```

### 2. Define Feature API

Create API types and client:

```typescript
// src/client/common/src/features/your-feature/api/types.ts
export interface YourFeatureRequest {
  // API request types
}

export interface YourFeatureResponse {
  // API response types
}

// src/client/common/src/features/your-feature/api/yourFeatureApi.ts
export class YourFeatureApi {
  async performAction(request: YourFeatureRequest): Promise<YourFeatureResponse> {
    // API implementation
  }
}
```

### 3. Create Feature Service

Implement business logic with DI integration:

```typescript
// src/client/common/src/features/your-feature/services/IYourFeatureService.ts
export interface IYourFeatureService {
  performAction(input: string): Promise<string>;
}

// src/client/common/src/features/your-feature/services/YourFeatureService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../platform/di/types';
import type { IConfigurationService } from '../../platform/config/services/IConfigurationService';

@injectable()
export class YourFeatureService implements IYourFeatureService {
  constructor(
    @inject(TYPES.ConfigurationService) private configService: IConfigurationService
  ) {}

  async performAction(input: string): Promise<string> {
    // Feature business logic
    return `Processed: ${input}`;
  }
}
```

### 4. Register in DI Container

Add feature services to the dependency injection system:

```typescript
// src/client/common/src/platform/di/types.ts
export const TYPES = {
  // Existing services
  ConfigurationService: Symbol.for('ConfigurationService'),
  
  // Feature services
  YourFeatureService: Symbol.for('YourFeatureService'),
} as const;

// src/client/common/src/features/your-feature/di/yourFeatureContainer.ts
import { Container } from 'inversify';
import { TYPES } from '../../platform/di/types';
import { YourFeatureService } from '../services/YourFeatureService';

export function registerYourFeatureServices(container: Container): void {
  container.bind<IYourFeatureService>(TYPES.YourFeatureService)
    .to(YourFeatureService)
    .inSingletonScope();
}
```

### 5. Create Feature Components

Build React components for the feature using shadcn/ui components (see [UI Components Pattern](./ui-components-pattern.md)):

```typescript
// src/client/common/src/features/your-feature/components/YourFeatureInterface.tsx
import React, { useState } from 'react';
import { useContainer } from '../../platform/di/ContainerContext';
import { TYPES } from '../../platform/di/types';
import type { IYourFeatureService } from '../services/IYourFeatureService';
import { Button } from '$/components/ui/button';
import { Input } from '$/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '$/components/ui/card';

export const YourFeatureInterface: React.FC = () => {
  const container = useContainer();
  const service = container.get<IYourFeatureService>(TYPES.YourFeatureService);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = async () => {
    const response = await service.performAction(input);
    setResult(response);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Feature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input..."
        />
        <Button onClick={handleSubmit} className="w-full">
          Process
        </Button>
        {result && (
          <div className="p-4 bg-muted rounded-md">
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 6. Create Test Page

Implement a comprehensive test page following the established pattern (use shadcn/ui components):

```typescript
// src/client/common/src/features/your-feature/views/YourFeatureTestPage.tsx
import React from 'react';
import { YourFeatureInterface } from '../components/YourFeatureInterface';
import { Button } from '$/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$/components/ui/card';
import { Separator } from '$/components/ui/separator';

const YourFeatureTestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Feature Test Page</h1>
      
      {/* Feature-specific test controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="default">Test Action 1</Button>
            <Button variant="secondary">Test Action 2</Button>
            <Button variant="destructive">Reset</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Main feature interface */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Feature Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <YourFeatureInterface />
        </CardContent>
      </Card>
      
      {/* Debug/Development tools */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Configuration</h3>
            <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
              {/* Display current configuration */}
            </pre>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-semibold mb-2">Logs</h3>
            <div className="bg-muted p-4 rounded-md text-sm">
              {/* Display feature logs */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YourFeatureTestPage;
```

### 7. Add Configuration Integration

Extend the platform configuration system:

```typescript
// src/client/common/src/platform/config/types/core.ts
export interface CoreConfig {
  // Existing config
  api: ApiConfig;
  features: FeatureConfig;
  
  // Feature-specific config
  yourFeature?: YourFeatureConfig;
}

export interface YourFeatureConfig {
  enabled: boolean;
  apiEndpoint: string;
  timeout: number;
}

// src/client/common/src/platform/config/defaults.ts
export const defaultCoreConfig: CoreConfig = {
  // Existing defaults
  api: { /* ... */ },
  features: { /* ... */ },
  
  // Feature defaults
  yourFeature: {
    enabled: true,
    apiEndpoint: 'https://api.example.com/your-feature',
    timeout: 30000,
  },
};
```

### 8. Update Routing

Add the test page to the routing system:

```typescript
// src/client/common/src/routes/index.tsx
import YourFeatureTestPage from '../features/your-feature/views/YourFeatureTestPage';

const PlatformRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Dash />} />
      
      {/* Feature test pages */}
      <Route path="test/auth" element={<AuthViewsIndex />} />
      <Route path="test/your-feature" element={<YourFeatureTestPage />} />
      
      {/* Existing routes */}
      <Route path="signin" element={<Login />} />
      {/* ... other routes */}
    </Route>
  </Routes>
);
```

### 9. Create Dashboard Card

Add a feature card to the main dashboard by updating `Dash.tsx` (using shadcn/ui components):

```typescript
// src/client/common/src/components/dashboard/FeatureCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$/components/ui/card';
import { Badge } from '$/components/ui/badge';
import { Button } from '$/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  testPagePath: string;
  miniPreview?: React.ReactNode;
  icon?: React.ReactNode;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  status,
  testPagePath,
  miniPreview,
  icon
}) => {
  const statusVariant = {
    active: 'default' as const,
    inactive: 'secondary' as const,
    error: 'destructive' as const
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div>{icon}</div>}
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant={statusVariant[status]}>
            {status}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      {miniPreview && (
        <CardContent>
          <div className="p-3 bg-muted rounded-md">
            {miniPreview}
          </div>
        </CardContent>
      )}
      
      <CardFooter>
        <Button asChild variant="ghost" className="w-full">
          <Link to={testPagePath} className="inline-flex items-center gap-2">
            Open Test Page
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// src/client/common/src/Dash.tsx (updated)
import React from 'react';
import { Link } from 'react-router-dom';
import { isUserAuthenticated } from './hooks/AuthHooks';
import { FeatureCard } from './components/dashboard/FeatureCard';
import { YourFeatureInterface } from './features/your-feature/components/YourFeatureInterface';

export function Dash() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div>
          {isUserAuthenticated() ? (
            <Link to="/signout" className="text-blue-600 hover:text-blue-800">Sign out</Link>
          ) : (
            <Link to="/signin" className="text-blue-600 hover:text-blue-800">Sign in</Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="Authentication"
          description="User authentication and account management"
          status="active"
          testPagePath="/test/auth"
        />
        
        <FeatureCard
          title="Your Feature"
          description="Description of your feature"
          status="active"
          testPagePath="/test/your-feature"
          miniPreview={<YourFeatureInterface />}
        />
        
        {/* Add more feature cards */}
      </div>
    </div>
  );
}
```

## Testing Strategy

### Test Page Requirements

Each feature test page should include:

1. **Test Controls**: Buttons and inputs for testing different scenarios
2. **Main Interface**: The actual feature interface for testing
3. **Debug Tools**: Configuration display, logs, state inspection
4. **Documentation**: Usage instructions and examples

### Testing Levels

1. **Unit Tests**: Test individual components and services
2. **Integration Tests**: Test feature with platform services
3. **Test Page**: Manual testing and debugging interface
4. **Dashboard Integration**: End-to-end feature workflow

## Configuration Integration

### Environment Variables

Add feature-specific environment variables:

```bash
# Your feature configuration
VITE_YOUR_FEATURE_ENABLED=true
VITE_YOUR_FEATURE_API_ENDPOINT=https://api.example.com/your-feature
VITE_YOUR_FEATURE_TIMEOUT=30000
```

### Configuration Provider

Extend the environment provider to handle feature config:

```typescript
// src/client/common/src/platform/config/providers/EnvironmentProvider.ts
function parseEnvironmentConfig(env: Record<string, any> = (import.meta as any).env || {}) {
  const config: Record<string, any> = {};
  
  // Existing config parsing...
  
  // Your feature configuration
  if (env.VITE_YOUR_FEATURE_ENABLED !== undefined) {
    if (!config.yourFeature) config.yourFeature = {};
    config.yourFeature.enabled = env.VITE_YOUR_FEATURE_ENABLED === 'true';
  }
  
  if (env.VITE_YOUR_FEATURE_API_ENDPOINT) {
    if (!config.yourFeature) config.yourFeature = {};
    config.yourFeature.apiEndpoint = env.VITE_YOUR_FEATURE_API_ENDPOINT;
  }
  
  return config;
}
```

## Best Practices

### 1. Service Design
- Use dependency injection for all services
- Implement interfaces for testability
- Leverage platform configuration system
- Use platform logging for consistency

### 2. Component Design
- Use shadcn/ui components for standard UI elements (see [UI Components Pattern](./ui-components-pattern.md))
- Keep components focused and reusable
- Use TypeScript for type safety
- Follow established naming conventions
- Implement proper error handling
- Ensure accessibility (WCAG 2.1 AA compliance)

### 3. Testing
- Create comprehensive test pages
- Include debug tools and logging
- Test edge cases and error scenarios
- Document testing procedures

### 4. Documentation
- Document feature purpose and usage
- Include configuration options
- Provide usage examples
- Maintain API documentation

## Example: AI Chat Feature

Here's a complete example of how the AI Chat feature would be implemented:

### Directory Structure
```
src/client/common/src/features/ai-chat/
├── api/
│   ├── aiChatApi.ts
│   └── types.ts
├── components/
│   ├── ChatInterface.tsx
│   ├── MessageList.tsx
│   ├── ChatInput.tsx
│   └── ChatMessage.tsx
├── stores/
│   └── aiChatStore.ts
├── views/
│   ├── AiChatPage.tsx
│   └── AiChatTestPage.tsx
├── services/
│   └── AiChatService.ts
└── di/
    └── aiChatContainer.ts
```

### Key Implementation Points

1. **Service Registration**: Register `AiChatService` in DI container
2. **Configuration**: Add AI chat settings to platform config
3. **Test Page**: Comprehensive testing interface with chat history, settings, debug tools
4. **Dashboard Card**: Mini chat interface preview with status indicator
5. **Routing**: Add `/test/ai-chat` route for test page access

## Additional Resources

### Related Documentation
- [UI Components Pattern](./ui-components-pattern.md) - Using and customizing shadcn/ui components
- [Modular Zustand Store Pattern](./modular-zustand-store-pattern.md) - State management patterns
- [Client Overview](../../overview/client/client-overview.md) - Overall client architecture
- [Platform Events System](../../overview/client/platform-events-system.md) - Cross-component communication
- [Debug Logging](../../overview/client/debug-logging.md) - Structured logging system

## Conclusion

This pattern provides a structured approach to feature development that:
- Maintains independence between features
- Leverages existing platform services (DI, configuration, logging)
- Uses consistent UI components (shadcn/ui)
- Provides comprehensive testing capabilities
- Integrates seamlessly with the dashboard
- Follows established conventions and best practices

By following this pattern, new features can be developed independently while maintaining consistency with the overall architecture and providing excellent developer experience through dedicated test pages. 