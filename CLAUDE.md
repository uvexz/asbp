# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- Install dependencies: `bun install`
  The repo has a `bun.lock`, but the README examples use `npm install`. Package scripts also work with `npm run ...`.
- Start the dev server: `bun run dev`
- Build for production: `bun run build`
- Start the production server: `bun run start`
- Lint: `bun run lint`
- Run all tests once: `bun run test`
- Run tests in watch mode: `bun run test:watch`
- Run a single test file: `bunx vitest --run src/lib/validations.property.test.ts`
- Generate Drizzle artifacts: `bun run db:generate`
- Push the schema to the database: `bun run db:push`
- Open Drizzle Studio: `bun run db:studio`

## Setup notes

- Copy `.env.example` to `.env.local` before running the app.
- Required env vars for local development are `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.
- `NEXT_PUBLIC_APP_URL` is recommended because it is used for sitemap, RSS, Open Graph metadata, and email links.
- `REDIS_URL` is optional. If unset, the app falls back to Next.js cache primitives.
- `drizzle.config.ts` loads `.env.local` directly.
- There is no dedicated typecheck script; `bun run build` is the closest full validation pass.

## Big-picture architecture

This is a Next.js 16 App Router app using React 19, TypeScript, Drizzle ORM, PostgreSQL, better-auth, next-intl, Tailwind CSS v4, and shadcn/Radix UI.

### App structure

- `src/app`
  - `(blog)`: public blog pages (`/`, `/:slug`, `/tag/:slug`, `/memo`)
  - `(auth)`: sign-in/sign-up pages
  - `admin`: protected CMS/admin area
  - `actions`: server actions for most reads and mutations
  - `api`: route handlers for auth, lightweight session data, import/export, first-run import, and Umami script proxying
  - top-level metadata routes: `feed.xml`, `sitemap.ts`, `robots.ts`
- `src/components`
  - `ui`: reusable primitives
  - `layout`: composed blog/admin UI
  - `admin`: admin/settings-specific panels
- `src/lib`: infrastructure and integration layer (auth, db, cache, Redis, crypto, S3, Resend, Umami, spam detection, validation)
- `src/db/schema.ts`: the full Drizzle schema and relations
- `src/i18n`: locale config, request-time locale resolution, and message bundles
- `drizzle/`: generated SQL migrations and schema snapshots

### Core patterns

- **Server actions are the default application API.** Most business logic lives in `src/app/actions/*`. Prefer extending an existing action pattern before adding a new route handler.
- **Auth is inline, not middleware-based.** There is no app-level auth middleware in the repository. Admin checks happen in `src/app/admin/layout.tsx`, server actions, and admin-only route handlers.
- **better-auth + Drizzle** back authentication. Email/password is enabled, passkeys are supported, and rate limiting is stored in the database.
- **The first registered user becomes admin**, and registration is then closed automatically. There is also a first-run import flow in `src/app/api/init-import/route.ts` that only works when the instance has no users yet.
- **Settings are a singleton row** in `settings` with `id = 1`.
- **Sensitive settings are encrypted at rest** before being stored in the database and decrypted only when needed.
- **Posts, pages, and memos share the same table.** `post.postType` distinguishes `'post'`, `'page'`, and `'memo'`. Public routing and list behavior depend on that field.
- **Caching is manual and important.** Public reads go through `src/lib/cache-layer.ts`, which uses Redis when `REDIS_URL` is present and falls back to `unstable_cache` + tag invalidation otherwise.
- **Admin edit flows often use uncached reads**, while public rendering paths use cached helpers.

### Content and data flow

- Public pages usually call server actions such as `getSettings`, `getNavItems`, `getPublishedPosts`, `getPublishedMemos`, `getPostBySlug`, and `getPostComments`.
- Mutation actions typically follow this pattern:
  1. read the session and enforce admin/auth rules
  2. validate input
  3. write through Drizzle
  4. invalidate cache-layer keys/tags
  5. call `revalidatePath` and sometimes `redirect`
- If you change posts, tags, navigation, comments, or settings, make sure both cache invalidation and path revalidation still line up with the changed behavior.

### Comments, media, and external integrations

- Logged-in user comments are auto-approved.
- Guest comments go through Zod validation plus whitelist/AI spam checks in `src/lib/spam-detector.ts`.
- Resend is optional and is used for comment/reply notification emails when configured.
- Media metadata lives in the database, while file storage uses S3-compatible object storage when configured.
- Umami analytics is optional and configured from stored settings; the tracking script is proxied through `/api/umami/script.js`.

### i18n and metadata

- The app currently supports `en` and `zh`.
- Locale resolution is: `locale` cookie -> `Accept-Language` header -> default `en`.
- `NEXT_PUBLIC_APP_URL` is used across metadata, sitemap, RSS, and email links, with `BETTER_AUTH_URL` as the server-side fallback.
- `next.config.ts` wraps the app with the `next-intl` plugin and enables the React compiler.

## Practical conventions for future edits

- Prefer the existing `@/*` import alias.
- Keep UI changes in the current layering:
  - primitive/shared widgets in `src/components/ui`
  - composed app widgets in `src/components/layout`
  - admin/settings panels in `src/components/admin`
- Before introducing a new data-fetch path for public pages, check whether a cached helper already exists in `src/lib/cache-layer.ts`.
- Before adding auth guards, check the existing inline pattern using `auth.api.getSession({ headers: await headers() })`.
- Import/export functionality already exists in `src/app/api/export/route.ts`, `src/app/api/import/route.ts`, and `src/app/api/init-import/route.ts`; reuse those flows instead of creating parallel content migration logic.
- The current test footprint is small and Vitest-based; the checked-in test file is `src/lib/validations.property.test.ts`.

## Design Context

### Users
- Primary audience: personal blog owners managing a lightweight self-hosted publishing site.
- Core jobs: publish posts and memos, manage comments and settings, and maintain a clean reader-facing blog without unnecessary operational complexity.
- Secondary context inferred from the product: technically comfortable owners/admins who may configure storage, email, analytics, and auth features themselves.

### Brand Personality
- Personality: calm, minimal, confident.
- Emotional goal: make publishing and reading feel quiet, clear, and dependable rather than loud or hype-driven.
- Voice should stay restrained and useful, with content taking priority over decorative UI.

### Aesthetic Direction
- Existing product direction is a content-first editorial blog paired with a simple utilitarian admin area.
- Current visual system uses Geist typography, a mostly neutral grayscale palette, rounded surfaces, and a restrained lime accent (`#4cdf20`) used selectively for primary admin actions.
- Prioritize light-mode quality first; dark mode exists, but future design decisions should be judged primarily by how well they work in light mode.
- No external visual references were provided, so future design work should extend the current product language rather than introducing a new stylistic direction.

### Design Principles
1. Keep the reading experience primary: favor typography, spacing, and hierarchy that support content consumption over decorative chrome.
2. Default to calm minimalism: remove unnecessary visual noise and avoid flashy gradients, gimmicky motion, or overly expressive SaaS styling.
3. Use emphasis sparingly: reserve accent color and stronger visual weight for clear calls to action, important state changes, and navigation cues.
4. Make admin tools feel efficient and dependable: clear labels, obvious actions, and dense-but-legible layouts are preferable to ornamental complexity.
5. Optimize for light-mode clarity: preserve strong contrast, readable text, and clean surfaces in light mode before refining dark-mode treatments.
