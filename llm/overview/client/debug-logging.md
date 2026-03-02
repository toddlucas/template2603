# Debug Logging System

## Overview

The client application includes a comprehensive debug logging system that provides detailed insights into application behavior while maintaining zero runtime overhead in production builds. This system uses environment variables to control debug output and enables complete tree-shaking for optimal performance.

## Key Features

### **Tree-Shaking Support**
- Logging statements are completely removed in production builds
- Zero runtime overhead when debug logging is disabled
- Build-time optimization for maximum performance

### **Call Site Preservation**
- Logging statements show the actual file location in browser dev tools
- No wrapper functions that obscure the original call site
- Direct console logging for accurate stack traces

### **Single-Line Requirement**
- **ALL debug statements MUST be single-line** for optimal tree-shaking
- Use `if (LOG_CONFIG.CATEGORY >= LOG_LEVELS.LEVEL) console.log(...)` format
- Never use multi-line blocks for debug statements
- This ensures complete removal in production builds

### **Category-Based Logging**
- Different debug categories for different system components
- Independent control over each category's verbosity
- Easy identification with category-specific emojis

### **Environment-Driven Configuration**
- Log levels controlled by environment variables
- Different settings for development and production
- No code changes required to adjust debug output

## Log Categories

The system supports different debug categories, each with independent control:

| Category     | Environment Variable | Emoji | Description                           |
|--------------|----------------------|-------|---------------------------------------|
| **CONFIG**   | `VITE_LOG_CONFIG`    | 🔧   | Configuration loading and saving      |
| **DI**       | `VITE_LOG_DI`        | 🏗️   | Dependency injection operations       |
| **PLATFORM** | `VITE_LOG_PLATFORM`  | 🖥️   | Platform detection and initialization |

## Log Levels

Each category supports six debug levels, from minimal to maximum verbosity:

| Level       | Value | Description           | Use Case              |
|-------------|-------|-----------------------|-----------------------|
| **NONE**    | 0     | No debug output       | Production builds     |
| **ERROR**   | 1     | Error messages only   | Critical issues       |
| **WARN**    | 2     | Warnings and errors   | Potential issues      |
| **INFO**    | 3     | Important information | Key operations        |
| **DEBUG**   | 4     | Detailed debugging    | Development debugging |
| **VERBOSE** | 5     | Maximum detail        | Deep troubleshooting  |

## Environment Configuration

### **Development Environment**
```bash
# .env.development
VITE_LOG_CONFIG=5
VITE_LOG_DI=4
VITE_LOG_PLATFORM=4
```

### **Production Environment**
```bash
# .env.production
VITE_LOG_CONFIG=0
VITE_LOG_DI=0
VITE_LOG_PLATFORM=0
```

### **Testing Environment**
```bash
# .env.test
VITE_LOG_CONFIG=3
VITE_LOG_DI=2
VITE_LOG_PLATFORM=2
```

## Usage Examples

### **Basic Logging Statements**

```typescript
import { LOG_CONFIG, LOG_LEVELS } from '@/platform/debug';

// Simple info logging - SINGLE LINE ONLY
if (LOG_CONFIG.DI >= LOG_LEVELS.INFO) console.log('🔧 [DI] Configuration loaded successfully');

// Example service logging - SINGLE LINE ONLY
if (LOG_CONFIG.EXAMPLE_SERVICE >= LOG_LEVELS.DEBUG) console.log('🚀 [EXAMPLE SERVICE] Processing user message:', messageId);
```

### **Log Prefix Format**

The debug prefix format is: `[DEBUG CATEGORY]` for LOG_CONFIG.DEBUG_CATEGORY, optionally followed by a component name:

```typescript
// Basic format: [DEBUG CATEGORY]
if (LOG_CONFIG.EXAMPLE >= LOG_LEVELS.DEBUG) console.log('🤖 [EXAMPLE] Provider initialized');

// With component name: [DEBUG CATEGORY] ComponentName
if (LOG_CONFIG.EXAMPLE_SERVICE >= LOG_LEVELS.DEBUG) console.log('🚀 [EXAMPLE SERVICE] EventCoordinator initialized');

// With operation context: [DEBUG CATEGORY] ComponentName: Operation
if (LOG_CONFIG.EXAMPLE_SERVICE >= LOG_LEVELS.DEBUG) console.log('📨 [EXAMPLE SERVICE] EventCoordinator: Processing user  message');
```

**Prefix Guidelines:**
- Always start with `[DEBUG CATEGORY]` to show which debug flag is enabled
- Optionally add component name for clarity: `[EXAMPLE SERVICE] EventCoordinator`
- Use descriptive operation names: `[EXAMPLE SERVICE] EventCoordinator: Processing user message`
- Keep prefixes concise but informative

### **Error Handling**

```typescript
try {
  // ... some operation
} catch (error) {
  if (LOG_CONFIG.DI >= LOG_LEVELS.ERROR) console.error('🔧 [DI] Failed to load configuration:', error);
  throw error;
}
```

### **Conditional Logging**

```typescript
// Only log when in development mode - SINGLE LINE ONLY
if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) console.log('🖥️ [PLATFORM] Creating window with config:', windowConfig);

// Log different levels based on operation importance - SINGLE LINE ONLY
if (LOG_CONFIG.DI >= LOG_LEVELS.INFO) console.log('📦 [DI] Provider loaded successfully');
else if (LOG_CONFIG.DI >= LOG_LEVELS.ERROR) console.error('📦 [DI] Provider failed to load:', error);
```

## Integration Points

TODO

## Log Output Examples

### **DI Loading**
```
🔧 [DI] Loading configuration from providers...
🔧 [DI] Loading from provider: EnvironmentProvider
📦 [PLATFORM] Loading environment variables...
📦 [PLATFORM] Found VITE_API_BASE_URL: https://api.example.com
📦 [PLATFORM] Found VITE_LOG_MODE: true
📦 [PLATFORM] Environment provider loaded successfully
🔧 [DI] Provider loaded successfully: EnvironmentProvider
🔧 [DI] Configuration loaded successfully
```

### **Platform Operations**
```
🖥️ [PLATFORM] Creating Electron window...
🖥️ [PLATFORM] Loading main process configuration...
🖥️ [PLATFORM] Creating BrowserWindow with config: { width: 1200, height: 800, center: true, resizable: true }
```

## Best Practices

### **1. Choose Appropriate Log Levels**
- Use `INFO` for important operations
- Use `DEBUG` for detailed troubleshooting
- Use `VERBOSE` only for deep investigation
- Use `ERROR` for error conditions

### **2. Keep Log Messages Concise**
```typescript
// ✅ Good: Single line, clear message
if (LOG_CONFIG.DI >= LOG_LEVELS.INFO) console.log('🔧 [DI] Configuration loaded successfully');

// ❌ Bad: Multi-line block (breaks tree-shaking)
if (LOG_CONFIG.DI >= LOG_LEVELS.INFO) {
  console.log('🔧 [DI] Configuration loaded successfully');
}

// ❌ Bad: Too verbose for info level
if (LOG_CONFIG.DI >= LOG_LEVELS.INFO) console.log('🔧 [DI] The configuration system has successfully completed the loading process and is now ready for use');
```

### **3. Include Relevant Data**
```typescript
// ✅ Good: Include useful context, single line
if (LOG_CONFIG.DI >= LOG_LEVELS.DEBUG) console.log('📦 [DI] Provider loaded:', providerName, 'with', configKeys.length, 'keys');

// ❌ Bad: Too much data, multi-line
if (LOG_CONFIG.DI >= LOG_LEVELS.DEBUG) {
  console.log('📦 [DI] Provider loaded with full config:', JSON.stringify(config, null, 2));
}
```

### **4. Common Mistakes to Avoid**
- **Multi-line blocks**: Always use single-line format for optimal tree-shaking
- **Missing prefixes**: Always include `[DEBUG CATEGORY]` in the message
- **Wrong debug levels**: Use appropriate level for message importance
- **Inconsistent formatting**: Follow the established prefix patterns
- **Missing component names**: Add component names for clarity when needed

### **5. Use Error Level for Exceptions**
```typescript
try {
  // ... operation
} catch (error) {
  if (LOG_CONFIG.DI >= LOG_LEVELS.ERROR) console.error('🔧 [DI] Operation failed:', error);
  throw error;
}
```

## Performance Considerations

### **Tree-Shaking in Production**
- All debug statements are completely removed in production builds
- No runtime overhead when debug logging is disabled
- Environment variables control build-time optimization

### **Development vs Production**
```typescript
// Development: Full debug output
VITE_LOG_DI=5
VITE_LOG_PLATFORM=5

// Production: No debug output
VITE_LOG_DI=0
VITE_LOG_PLATFORM=0
```

### **Conditional Compilation**
```typescript
// This entire block is removed in production when VITE_LOG_CONFIG=0
if (LOG_CONFIG.DI >= LOG_LEVELS.VERBOSE) {
  console.log('🔧 [DI] Verbose debug information');
}
```

## Troubleshooting

### **Log Output Not Appearing**
1. Check environment variables are set correctly
2. Verify debug level is sufficient for the message
3. Ensure the category is enabled
4. Check browser console for any errors

### **Too Much Log Output**
1. Reduce debug levels in environment variables
2. Use more specific debug levels (INFO instead of VERBOSE)
3. Disable specific categories by setting to 0

### **Performance Issues**
1. Ensure production builds have log levels set to 0
2. Check that tree-shaking is working correctly
3. Verify no logging statements are running in production

## Future Enhancements

- **Log Filters**: Filter log output by specific operations
- **Log Persistence**: Save logs to files
- **Remote Logging**: Send log output to remote services
- **Performance Metrics**: Include timing information in debug output
- **Logging UI**: In-app logging panel for runtime configuration

## Migration from Console.log

### **Before (Traditional)**
```typescript
console.log('Loading configuration...');
console.log('Provider loaded:', providerName);
console.error('Failed to load config:', error);
```

### **After (Debug System)**
```typescript
if (LOG_CONFIG.DI >= LOG_LEVELS.INFO) console.log('🔧 [DI] Loading configuration...');

if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) console.log('📦 [PLATFORM] Provider loaded:', providerName);

if (LOG_CONFIG.DI >= LOG_LEVELS.ERROR) console.error('🔧 [DI] Failed to load config:', error);
```

This debug logging system provides powerful debugging capabilities while maintaining optimal performance in production environments. 