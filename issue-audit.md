# Issue Audit

## 1) [P0] Public slug route exposes unpublished posts/pages

**Priority**: P0 / Critical

### Summary
Public article detail pages can render unpublished content if the slug is known. The public fetch path looks up records by `slug` only and does not enforce `published = true`.

### Evidence
- `src/lib/cache-layer.ts:194-201`
- `src/app/(blog)/[slug]/page.tsx:73-79`

### Expected behavior
The public `[slug]` route should only return content intended for public viewing. Draft/unpublished posts and pages should return 404 or otherwise be denied on public routes.

### Acceptance criteria
- [x] Public slug lookups only return published content
- [x] Draft/unpublished posts return 404 on public routes
- [x] Public slug lookups do not accidentally expose unsupported `postType` values
- [x] Add regression tests covering published vs unpublished access

---

## 2) [P0] Restore baseline automated test coverage

**Priority**: P0 / Critical

### Summary
The repository currently has effectively no application tests. The previously known validation test file has been deleted, and `bun run test` exits with `No test files found`.

### Evidence
- Deleted file: `src/lib/validations.property.test.ts`
- `bun run test` currently returns: `No test files found`

### Expected behavior
The repository should have a minimal automated test baseline covering critical validation and behavior paths.

### Acceptance criteria
- [x] Reintroduce at least one working test suite under the existing Vitest config
- [x] Add coverage for validation schemas (`postSchema`, `commentSchema`, `tagSchema`)
- [x] Add coverage for at least one critical mutation flow
- [x] `bun run test` passes in a clean checkout

---

## 3) [P1] Updating post tags does not invalidate public caches

**Priority**: P1 / High

### Summary
When post-tag associations are updated, only the admin posts page is revalidated. Public tag pages and any post detail/tag-derived cache paths can remain stale.

### Evidence
- `src/app/actions/tags.ts:211-228`

### Expected behavior
Changing a post’s tags should invalidate all affected public caches and revalidate affected public pages.

### Acceptance criteria
- [x] Updating post tags invalidates related tag-list caches
- [x] Updating post tags invalidates affected post detail caches if tag data is rendered there
- [x] Related public routes are revalidated as needed
- [x] Add regression coverage for tag updates affecting public views

---

## 4) [P1] Import flow does not invalidate caches or revalidate public pages

**Priority**: P1 / High

### Summary
The import route writes content into the database and returns success without clearing application caches or revalidating affected pages. Imported content may not appear immediately on the site.

### Evidence
- `src/app/api/import/route.ts:68-213`

### Expected behavior
After a successful import, all relevant caches should be invalidated and the affected pages revalidated so imported data is visible immediately.

### Acceptance criteria
- [x] Successful import invalidates relevant cache-layer keys/tags
- [x] Successful import revalidates affected public routes
- [x] Imported posts, tags, navigation, comments, and settings become visible without waiting for TTL expiry
- [x] Add an integration/regression test for post-import visibility

---

## 5) [P1] Saving settings can clear existing encrypted secrets

**Priority**: P1 / High

### Summary
Sensitive settings fields are converted to `null` when left blank and then written back during update. This can unintentionally erase stored S3/Resend/AI/Umami credentials when editing unrelated settings.

### Evidence
- `src/app/actions/settings.ts:107-120`
- `src/app/actions/settings.ts:149-171`

### Expected behavior
Leaving a secret field blank during an edit should preserve the existing stored secret unless the user explicitly chooses to clear it.

### Acceptance criteria
- [x] Blank secret inputs do not overwrite existing stored secrets
- [x] Secrets are only cleared via an explicit clear/remove action
- [x] Updating non-secret settings preserves existing encrypted values
- [x] Add regression tests for preserving existing secrets on update

---

## 6) [P1] Guest comment CAPTCHA is only enforced client-side

**Priority**: P1 / High

### Summary
The UI requires CAPTCHA for guest comments, but the server action that creates comments does not verify a CAPTCHA token. Bots can bypass the UI and call the server action directly.

### Evidence
- `src/components/layout/comment-section.tsx:219-225`
- `src/components/layout/comment-section.tsx:310-315`
- `src/app/actions/comments.ts:96-177`

### Expected behavior
Guest comment submission should be enforced server-side, not only in the client UI.

### Acceptance criteria
- [x] Guest comment submissions require a server-validated CAPTCHA/token
- [x] Requests without a valid CAPTCHA are rejected server-side
- [x] Logged-in user comment flow remains unaffected
- [x] Add regression coverage for guest submission with and without valid CAPTCHA

---

## 7) [P1] Admin posts page paginates before filtering by post type

**Priority**: P1 / High

### Summary
The admin posts page fetches a paginated mixed list and only then filters by `postType`. This causes incorrect page contents and inaccurate pagination totals.

### Evidence
- `src/app/admin/posts/page.tsx:15-23`

### Expected behavior
Filtering by content type should happen before pagination so the list and `totalPages` reflect the selected type.

### Acceptance criteria
- [x] Filtering by `postType` is applied in the underlying query before pagination
- [x] `totalPages` matches the selected content type
- [x] Search + filter + pagination work together correctly
- [x] Add regression tests for filtered pagination behavior

---

## 8) [P2] Settings writes bypass the existing Zod settings schema

**Priority**: P2 / Medium

### Summary
A `settingsSchema` exists but is not used in the settings update path. Operational configuration is accepted directly from `FormData` without unified runtime validation.

### Evidence
- Schema definition: `src/lib/validations.ts:45-55`
- Update path: `src/app/actions/settings.ts:78-185`

### Expected behavior
Settings writes should validate structured input through the existing schema (or an updated schema) before persisting data.

### Acceptance criteria
- [ ] Settings update path uses schema-based runtime validation
- [ ] Invalid settings inputs return clear validation errors
- [ ] URL-like fields and other structured settings are validated consistently
- [ ] Tests cover valid and invalid settings submissions

---

## 9) [P2] Import result counters may over-report successful writes

**Priority**: P2 / Medium

### Summary
The import flow increments result counters after `onConflictDoNothing()` inserts, which can make reported counts higher than actual inserted rows.

### Evidence
- `src/app/api/import/route.ts:94-195`

### Expected behavior
Import summary counts should reflect actual inserted/updated rows, not attempted inserts.

### Acceptance criteria
- [ ] Import results distinguish attempted vs inserted vs skipped/conflicted rows
- [ ] Result counts match actual database changes
- [ ] Conflict/no-op cases are reported accurately
- [ ] Add regression tests for duplicate/conflict import scenarios

---

## 10) [P2] First-user bootstrap flow has race conditions and full-table existence checks

**Priority**: P2 / Medium

### Summary
The first-user/admin bootstrap logic checks user existence by loading the full users table and promotes the first user in a follow-up cleanup step. This is inefficient and may behave incorrectly under concurrent registrations.

### Evidence
- `src/app/actions/auth-helpers.ts:8-22`
- `src/app/actions/auth-helpers.ts:24-43`

### Expected behavior
First-user bootstrap should use an efficient existence check and an atomic/robust approach to first-admin assignment.

### Acceptance criteria
- [ ] User existence checks use `count`, `exists`, or `limit(1)` instead of full-table reads
- [ ] First-user admin assignment is safe under concurrent signups
- [ ] Registration closing behavior is consistent and deterministic
- [ ] Add regression coverage for first-user bootstrap behavior

---

## 11) [P2] Redis wildcard invalidation uses KEYS

**Priority**: P2 / Medium

### Summary
Redis cache invalidation uses `KEYS` for wildcard patterns. This is operationally fragile and can become expensive on larger datasets.

### Evidence
- `src/lib/cache-layer.ts:54-63`

### Expected behavior
Wildcard invalidation should use a safer pattern such as tracked keys, tag sets, or cursor-based scanning instead of `KEYS`.

### Acceptance criteria
- [ ] Wildcard invalidation no longer uses `KEYS`
- [ ] Replacement invalidation works for current cache groups
- [ ] Existing cache behavior remains correct after the change
- [ ] Add coverage or operational notes for the new invalidation approach

---

## 12) [P2] i18n is inconsistent across public content and metadata

**Priority**: P2 / Medium

### Summary
The app supports both `en` and `zh`, but some formatting and content paths are hard-coded to Chinese locale or Chinese strings.

### Evidence
- `src/app/(blog)/memo/page.tsx:47-53`
- `src/components/layout/comment-section.tsx:57-65`
- `src/app/feed.xml/route.ts:29`

### Expected behavior
Locale-sensitive formatting and user-facing strings should honor the active locale consistently.

### Acceptance criteria
- [ ] Date formatting respects the current locale
- [ ] Feed metadata language is not hard-coded incorrectly
- [ ] Remaining user-visible hard-coded Chinese strings are localized
- [ ] Add regression checks for both supported locales where practical

---

## 13) [P2] Import settings path only updates existing settings row

**Priority**: P2 / Medium

### Summary
The import route updates `settings(id=1)` but does not upsert. If the settings row does not already exist, the import can report success without actually creating settings.

### Evidence
- `src/app/api/import/route.ts:197-205`

### Expected behavior
Importing settings should create the singleton row if it does not exist, or update it if it does.

### Acceptance criteria
- [ ] Settings import uses a safe upsert strategy for the singleton row
- [ ] Import succeeds whether settings row already exists or not
- [ ] Result reporting accurately reflects whether settings were created/updated
- [ ] Add regression coverage for empty-db settings import

---

## 14) [P3] Lint output is noisy due to vendor/minified file warnings

**Priority**: P3 / Low

### Summary
Current lint output is dominated by warnings from a minified vendor asset, which makes it harder to notice actionable warnings in project code.

### Evidence
- `public/js/instantpage.min.js`
- Project-code warning: `src/app/(blog)/[slug]/page.tsx:75`

### Expected behavior
Lint output should be actionable and primarily reflect issues in maintained source code.

### Acceptance criteria
- [ ] Vendor/minified assets are excluded from inappropriate lint rules
- [ ] Real source warnings are addressed or intentionally tracked
- [ ] `bun run lint` produces clean or low-noise output

---

## 15) [P3] Repository documentation is inconsistent about package manager usage

**Priority**: P3 / Low

### Summary
Repository guidance and actual project artifacts indicate Bun is the intended workflow, but some documentation still shows npm-centric commands.

### Evidence
- Repo includes `bun.lock`
- Project guidance prefers Bun
- README still contains npm-oriented examples

### Expected behavior
Repository docs should consistently reflect the intended package manager and command workflow.

### Acceptance criteria
- [ ] README and project guidance consistently use Bun commands
- [ ] Any npm examples are either removed or clearly marked as alternatives
- [ ] Setup and development instructions match the current repository workflow
