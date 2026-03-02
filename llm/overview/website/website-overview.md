# Website Overview

## Project Purpose

The Product Name marketing website is a **Next.js application** that serves public-facing content including landing pages, product information, documentation, and marketing materials.

## Location

- **Directory**: `website/src/site/`
- **Repository**: Part of the workspace
- **Tech Stack**: Next.js 16, React 19, Tailwind CSS 4

## Distinction from Product Client

| Aspect | Marketing Website | Product Application |
|--------|------------------|---------------------|
| **Location** | `website/src/site/` | `main/src/client/` |
| **Framework** | Next.js 16 (SSR/SSG) | Vite 6 (SPA) |
| **Purpose** | Public marketing content | Authenticated application |
| **Audience** | Prospects, visitors | Customers, users |
| **Routing** | File-based (App Router) | React Router |

## Technology Stack

- **Next.js 16.1.1**: React framework with App Router
- **React 19.2.3**: Latest React
- **Tailwind CSS 4**: Utility-first styling (same as product)
- **shadcn/ui**: Shared component library (partial overlap)
- **MDX**: Markdown-based content with React components

## Development

### Running Locally

```bash
cd website/src/site
npm install
npm run dev
```

Default port: 3000

### Key Files

- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `components/` - Shared components
- `components/ui/` - shadcn/ui components

## Shared Resources

The website may share some UI components and design tokens with the product application, but maintains its own:
- Build configuration
- Dependency versions
- Component implementations (adapted for Next.js)

## When to Edit What

**Edit the website** when:
- Adding/updating marketing pages
- Changing public-facing content
- Updating landing pages
- Modifying documentation site

**Edit the product client** when:
- Building application features
- Updating authenticated user experience
- Adding business logic

---

For product application client documentation, see [Client Overview](../client/client-overview.md).

