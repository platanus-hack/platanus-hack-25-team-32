# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**scrapi.fast** - A Next.js application that converts web pages into deterministic APIs. Built for the Platanus Hack 2025 (Team 32) in the consumer AI track.

**Project Structure:**

- Main application lives in `scrapi.fast/` directory
- Monorepo-style structure with potential for multiple services

## Technology Stack

- **Framework:** Next.js 16.0.3 (App Router)
- **Runtime:** Bun (package manager and runtime)
- **Language:** TypeScript
- **Authentication:** Clerk
- **Database:** Neon (Postgres) via Drizzle ORM
- **UI Components:** Radix UI + shadcn/ui (New York variant)
- **Styling:** Tailwind CSS v4 with CSS variables
- **Fonts:** Geist (Sans & Mono)
- **Code Quality:** Biome (linter + formatter)
- **Icons:** Lucide React
- **Web Automation:** BrowserBase SDK

## Development Commands

All commands should be run from the `scrapi.fast/` directory:

```bash
# Install dependencies
bun install

# Development server (runs on http://localhost:3000)
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Lint code with Biome
bun run lint

# Format code with Biome
bun run format
```

## Architecture

### Database Schema

The application uses Drizzle ORM with Neon Postgres. Three core tables form a hierarchical structure:

1. **Project** (`src/db/schema/project.ts`)
   - User's container for organizing services
   - Fields: id, user_id, name, description, timestamps

2. **Service** (`src/db/schema/service.ts`)
   - Belongs to a Project (cascade delete)
   - Contains the scraping script
   - Fields: id, project_id, name, description, script, timestamps

3. **Deployment** (`src/db/schema/deployment.ts`)
   - Belongs to a Service (cascade delete)
   - Versioned deployments with status enum (draft/active/archived)
   - Fields: id, service_id, version, status, timestamps

Database connection configured in `src/db/index.ts` via `DATABASE_URL` environment variable.

### Application Structure

```
scrapi.fast/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with ClerkProvider + ThemeProvider
│   ├── page.tsx           # Landing page
│   ├── globals.css        # Global styles + Tailwind
│   └── dashboard/         # Protected dashboard routes
│       ├── layout.tsx     # Dashboard layout with sidebar
│       └── page.tsx       # Dashboard home
├── components/
│   ├── ui/                # shadcn/ui components (Radix-based)
│   ├── elements/          # Custom elements from tryelements.dev
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── sidebar.tsx
│   │   ├── query-interface.tsx
│   │   └── code-viewer.tsx
│   ├── theme-provider.tsx
│   └── theme-switcher-button.tsx
├── db/                    # Database layer
│   ├── index.ts          # Drizzle instance
│   └── schema/           # Drizzle schemas
├── hooks/                # React hooks
├── lib/                  # Utilities
└── proxy.ts              # Clerk middleware (Next.js 16 convention)
```

### Authentication Flow

- Clerk handles all authentication
- Middleware at `src/proxy.ts` protects routes using Next.js 16 proxy pattern
- User ID from Clerk links to projects in database

### UI System

- **Design System:** shadcn/ui components using Radix UI primitives
- **Theme:** Supports light/dark mode via next-themes
- **Styling:** Tailwind v4 with CSS variables for theming
- **Component Library:** Pre-configured with 50+ UI components in `src/components/ui/`
- **Configuration:** `components.json` defines aliases and paths
- **Custom Components:**
  - `dot-matrix.tsx` - Animated background effect
  - `scrapi-icon.tsx` / `scrapi-long-logo.tsx` - Brand assets
  - `code-block.tsx` - Syntax highlighted code display

## Code Style

- **Formatter:** Biome with 2-space indentation
- **Import Organization:** Automatic via Biome assist actions
- **Linting:** Biome with Next.js and React recommended rules
- **Path Aliases:** Use `@/` prefix (e.g., `@/components/ui/button`)
- **Component Convention:** React Server Components by default (use `'use client'` when needed)

## Environment Variables

Required variables (see `.env.local`):

- `DATABASE_URL` - Neon Postgres connection string
- Clerk authentication variables (check Clerk dashboard)
- BrowserBase API credentials (for web automation)

## Important Notes

- `src/proxy.ts` uses the Next.js 16 proxy pattern for middleware (replaces the older `middleware.ts` convention)
- All UI components follow the shadcn/ui pattern with Radix primitives
- Database operations use Drizzle ORM with prepared statements via Neon HTTP
- Theme switching works via CSS variables defined in `globals.css`
