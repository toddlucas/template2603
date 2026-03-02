# Environment Configuration

This directory contains environment variable templates for different build modes.

## Quick Start

1. Copy the appropriate template file:
   ```bash
   # For development
   cp env.development.template .env.development.local
   
   # For production
   cp env.production.template .env.production.local
   
   # For testing
   cp env.test.template .env.test.local
   ```

2. Modify the `.local` file as needed (these are gitignored)

## Environment Files

- `env.*.template` - Committed templates with sensible defaults
- `.env.development.local` - Your local development overrides (gitignored)
- `.env.production.local` - Your local production overrides (gitignored)
- `.env.test.local` - Your local test overrides (gitignored)

## Vite Environment Loading

Vite loads environment files in this order (later files override earlier ones):

1. `.env` - All cases
2. `.env.local` - All cases, ignored by git
3. `.env.[mode]` - Only in specified mode (e.g., `.env.development`)
4. `.env.[mode].local` - Only in specified mode, ignored by git

## Debug Logging Levels

The `VITE_LOG_*` variables control debug output granularity:

| Level | Value | Description           |
|-------|-------|-----------------------|
| NONE  | 0     | No debug output       |
| ERROR | 1     | Error messages only   |
| WARN  | 2     | Warnings and errors   |
| INFO  | 3     | Important information |
| DEBUG | 4     | Detailed debugging    |
| VERBOSE | 5   | Maximum detail        |

### Debug Categories

**Platform & Infrastructure:**
- `VITE_LOG_CONFIG` - Configuration loading and saving
- `VITE_LOG_DI` - Dependency injection operations
- `VITE_LOG_EVENT` - Event bus operations
- `VITE_LOG_PLATFORM` - Platform detection and initialization
- `VITE_LOG_AUTH` - Authentication operations

**MVP Features:**
- `VITE_LOG_CONTACTS` - Contact management operations
- `VITE_LOG_SEQUENCES` - Sequence building and execution
- `VITE_LOG_AI` - AI operations (research, generation, analysis)
- `VITE_LOG_EMAIL` - Email sending and tracking
- `VITE_LOG_INBOX` - Inbox and reply management
- `VITE_LOG_ANALYTICS` - Analytics and metrics

## Recommended Settings

**Development:** Set categories you're actively working on to `4` (DEBUG) or `5` (VERBOSE), others to `3` (INFO)

**Production:** All should be `0` (NONE) for optimal tree-shaking and performance

**Testing:** Set to `2` (WARN) or `3` (INFO) to reduce test output noise

