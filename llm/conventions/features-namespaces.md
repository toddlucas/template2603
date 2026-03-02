# Feature and Namespace Names

These names should be used on the client and server to group objects.
The names were intentionally chosen to minimize risk of conflict with actual type and object names.

## Organizational Structure

**Server (C#/.NET)**: Namespace-first organization
- Namespace is the top-level grouping (e.g., `Prospecting`)
- Subdirectories can be used within namespaces for code organization (e.g., `Prospecting/Importing`)
- Example: `Base2.Data/src/Prospecting/Importing/ContactImport.cs`

**Client (React/TypeScript)**: Feature-first, then functional organization
- Feature is the top-level directory (e.g., `features/prospecting`)
- Functional separation comes next: `api/`, `components/`, `views/`, `services/`, `locales/`
- Subdirectories for organization happen WITHIN functional directories
- Example: `client/web/src/features/prospecting/components/importing/CsvUploader.tsx`

**❌ Incorrect** (client): `features/prospecting/importing/components/`  
**✅ Correct** (client): `features/prospecting/components/importing/`
