# Debug Logging System

A comprehensive, tree-shakeable debug logging system for the platform.

## Quick Reference

### Import

```typescript
import { LOG_CONFIG, LOG_LEVELS } from '@/platform/logging';
// or from common
import { LOG_CONFIG, LOG_LEVELS } from '$/platform/logging';
```

### Usage

```typescript
// Single-line format (required for tree-shaking)
if (LOG_CONFIG.CONTACTS >= LOG_LEVELS.INFO) console.log('📇 [CONTACTS] Contact created:', contactId);
if (LOG_CONFIG.AI >= LOG_LEVELS.DEBUG) console.log('🤖 [AI] Generating email:', contactId);
```

## Available Categories

### Platform & Infrastructure

| Category | Env Variable | Emoji | Description |
|----------|-------------|-------|-------------|
| CONFIG | `VITE_LOG_CONFIG` | 🔧 | Configuration loading and saving |
| DI | `VITE_LOG_DI` | 🏗️ | Dependency injection operations |
| EVENT | `VITE_LOG_EVENT` | 📤 | Event bus operations |
| PLATFORM | `VITE_LOG_PLATFORM` | 🖥️ | Platform detection and initialization |
| AUTH | `VITE_LOG_AUTH` | 🔐 | Authentication operations |

### MVP Features

| Category | Env Variable | Emoji | Description |
|----------|-------------|-------|-------------|
| CONTACTS | `VITE_LOG_CONTACTS` | 📇 | Contact management operations |
| SEQUENCES | `VITE_LOG_SEQUENCES` | 📧 | Sequence building and execution |
| AI | `VITE_LOG_AI` | 🤖 | AI operations (research, generation, analysis) |
| EMAIL | `VITE_LOG_EMAIL` | 📨 | Email sending and tracking |
| INBOX | `VITE_LOG_INBOX` | 📥 | Inbox and reply management |
| ANALYTICS | `VITE_LOG_ANALYTICS` | 📊 | Analytics and metrics |

## Log Levels

| Level | Value | Use Case |
|-------|-------|----------|
| NONE | 0 | Production (tree-shaking removes all logs) |
| ERROR | 1 | Critical issues only |
| WARN | 2 | Warnings and errors |
| INFO | 3 | Important operations |
| DEBUG | 4 | Detailed debugging (development) |
| VERBOSE | 5 | Maximum detail (troubleshooting) |

## Configuration

### Environment Files

See the app-specific `ENV_SETUP.md` for details on configuring environment variables.

- **Development**: Set active categories to `4` (DEBUG), others to `3` (INFO)
- **Production**: All to `0` (NONE) for tree-shaking
- **Testing**: Set to `2` (WARN) or `3` (INFO)

### Example Configuration

```bash
# Development - debugging contacts and AI
VITE_LOG_CONTACTS=4
VITE_LOG_AI=5
VITE_LOG_SEQUENCES=3
VITE_LOG_EMAIL=3
```

## Best Practices

### ✅ Do

```typescript
// Single-line format
if (LOG_CONFIG.CONTACTS >= LOG_LEVELS.INFO) console.log('📇 [CONTACTS] Contact imported:', contact.email);

// Include context
if (LOG_CONFIG.AI >= LOG_LEVELS.DEBUG) console.log('🤖 [AI] Research completed for:', contactId, 'tokens:', tokenCount);

// Use appropriate level
if (LOG_CONFIG.EMAIL >= LOG_LEVELS.ERROR) console.error('📨 [EMAIL] Send failed:', error);
```

### ❌ Don't

```typescript
// Multi-line blocks (breaks tree-shaking)
if (LOG_CONFIG.CONTACTS >= LOG_LEVELS.INFO) {
  console.log('📇 [CONTACTS] Contact imported');
}

// Missing category prefix
if (LOG_CONFIG.CONTACTS >= LOG_LEVELS.INFO) console.log('Contact imported');

// Wrong log level
if (LOG_CONFIG.SEQUENCES >= LOG_LEVELS.INFO) console.log('🤖 [SEQUENCES] Verbose debug data:', hugeObject);
```

## Architecture

### Tree-Shaking

When log levels are set to `0` in production:

```typescript
// This code:
if (LOG_CONFIG.CONTACTS >= LOG_LEVELS.DEBUG) console.log('Debug message');

// Becomes (after tree-shaking):
if (0 >= 4) console.log('Debug message');  // false, entire block removed
```

### Call Site Preservation

Direct console logging preserves the original file location in browser dev tools, unlike wrapper functions.

## Testing

Tests are located in:
- `log.test.ts` - Basic logging system tests
- `platform-log.test.ts` - PLATFORM category tests
- `mvp-log-categories.test.ts` - MVP feature category tests

Run tests:
```bash
npm test platform/logging
```

## Documentation

For detailed usage and examples, see:
- [Debug Logging System Guide](../../../../../../doc/overview/client/debug-logging.md)
- [ENV_SETUP.md](../../../../web/ENV_SETUP.md) (in web/admin apps)

## Adding New Categories

1. Add to `config.ts`:
   ```typescript
   NEW_FEATURE: parseInt(env.VITE_LOG_NEW_FEATURE || '0') || LOG_LEVELS.NONE,
   ```

2. Add to `vite-env.d.ts` in web/admin:
   ```typescript
   readonly VITE_LOG_NEW_FEATURE: string | undefined;
   ```

3. Update env templates in web/admin:
   ```bash
   VITE_LOG_NEW_FEATURE=4
   ```

4. Add tests in `mvp-log-categories.test.ts`

5. Update documentation tables above

