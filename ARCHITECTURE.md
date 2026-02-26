# ConsoleBlue Architecture Plan

## Overview

ConsoleBlue is the central management dashboard for the TriadBlue ecosystem. This rebuild transforms it from a read-only GitHub API proxy into a fully manageable project console with per-project configuration, CRUD operations, caching, and custom theming.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + shadcn/ui + wouter + TanStack Query + @dnd-kit
- **Backend:** Express.js (single consolidated server — no more separate Vercel API)
- **Database:** PostgreSQL + Drizzle ORM
- **GitHub Integration:** Octokit (singleton service, owner from env var)
- **Deployment:** Replit (autoscale)

---

## Database Schema (5 new tables)

### projects
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| slug | varchar(100) UNIQUE | URL-safe, e.g. "swipesblue" |
| display_name | varchar(200) | Override GitHub name |
| description | text | |
| github_repo | varchar(200) | Repo name, e.g. "swipesblue" |
| github_owner | varchar(100) | Defaults to env GITHUB_OWNER |
| default_branch | varchar(100) | Default: "main" |
| color_primary | varchar(7) | Hex, e.g. "#0000FF" |
| color_accent | varchar(7) | Hex, e.g. "#FF44CC" |
| color_background | varchar(7) | Optional |
| icon_url | text | Custom icon URL |
| icon_emoji | varchar(10) | Emoji alternative |
| status | enum | active/archived/maintenance/development/planned |
| display_order | integer | For drag-and-drop reordering |
| visible | boolean | Show/hide in dashboard |
| tags | jsonb | String array |
| subdomain_url | varchar(500) | e.g. "linkblue.triadblue.com" |
| production_url | varchar(500) | Full URL |
| custom_settings | jsonb | Per-project JSON blob |
| last_synced_at | timestamp | |
| sync_enabled | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### project_settings
Per-project key-value configuration with categories.

### user_preferences
Per-user key-value preferences.

### github_sync_cache
PostgreSQL-backed cache for GitHub API responses with configurable TTL per endpoint.

### audit_log
Tracks all mutations: who changed what, when, with previous/new value snapshots.

---

## API Routes

### Project CRUD
| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/projects | List (filterable by status, tag, visibility) |
| GET | /api/projects/:idOrSlug | Get single project + settings |
| POST | /api/projects | Create |
| PUT | /api/projects/:idOrSlug | Update |
| DELETE | /api/projects/:idOrSlug | Soft delete (archive) |
| POST | /api/projects/reorder | Drag-and-drop reorder |

### Per-Project Settings
| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/projects/:idOrSlug/settings | Get all settings |
| PUT | /api/projects/:idOrSlug/settings | Upsert settings |
| DELETE | /api/projects/:idOrSlug/settings/:key | Remove a setting |

### Per-Project Colors
| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/projects/:idOrSlug/colors | Get colors |
| PUT | /api/projects/:idOrSlug/colors | Update colors |

### GitHub Proxy (cached, query-param style to avoid SPA catch-all)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/github/repos | List repos (cached 5min) |
| GET | /api/github/tree?repo=X&path=Y | Directory listing (cached 5min) |
| GET | /api/github/file?repo=X&path=Y | File content (cached 10min) |
| GET | /api/github/routes?repo=X | Extract routes (cached 10min) |
| GET | /api/github/commits?repo=X&count=N | Commits (cached 2min) |
| GET | /api/github/search?repo=X&query=Q | File search (cached 5min) |
| POST | /api/github/sync | Manual sync (single or all) |

All GitHub routes support `?force=true` to bypass cache.

### System
| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/health | Health check (no auth) |
| GET | /api/audit | Audit log viewer |
| GET/PUT | /api/user/preferences | User preferences |

---

## Seed Data (initial projects)

| Slug | Display Name | Primary Color | Accent | Subdomain |
|------|-------------|---------------|--------|-----------|
| triadblue | TriadBlue | #0000FF | #FF44CC | triadblue.com |
| consoleblue | ConsoleBlue | #0000FF | #FF44CC | consoleblue.triadblue.com |
| linkblue | LinkBlue | #0066FF | #00CCFF | linkblue.triadblue.com |
| hostsblue | HostsBlue | #6600CC | #9933FF | hostsblue.com |
| swipesblue | SwipesBlue | #CC0000 | #FF3333 | swipesblue.com |
| businessblueprint | BusinessBlueprint | #006633 | #00CC66 | — |
| scansblue | ScansBlue | #FF6600 | #FF9933 | — |

---

## File Structure

```
consoleblue-triadblue/
  shared/
    schema.ts              # Drizzle tables + enums + relations
    validators.ts          # Zod schemas
    types.ts               # Shared TypeScript interfaces

  server/
    index.ts               # Express bootstrap
    routes.ts              # Route registrar
    routes/
      projects.ts          # Project CRUD
      project-settings.ts  # Per-project settings
      project-colors.ts    # Color endpoints
      user-preferences.ts  # User prefs
      github.ts            # Cached GitHub proxy
      health.ts            # Health check
      audit.ts             # Audit log
    middleware/
      auth.ts              # Session auth
      api-key.ts           # x-api-key auth
      github-cache.ts      # PostgreSQL cache layer
      validation.ts        # Zod middleware factory
      error-handler.ts     # Centralized errors
    services/
      github.service.ts    # Octokit singleton
      cache.service.ts     # Cache operations
      sync.service.ts      # Background sync job
      audit.service.ts     # Audit writer
    db/
      seed.ts              # Initial project data

  client/src/
    hooks/
      use-projects.ts
      use-project-settings.ts
      use-project-colors.ts
      use-github.ts
      use-user-preferences.ts
      use-audit-log.ts
    pages/
      ProjectListPage.tsx       # Sortable/filterable grid
      ProjectDetailPage.tsx     # Project view with tabs
      ProjectSettingsPage.tsx   # Per-project config
      ProjectGitHubPage.tsx     # Repo explorer
      UserPreferencesPage.tsx
      AuditLogPage.tsx
    components/
      projects/
        ProjectCard.tsx
        ProjectGrid.tsx
        ProjectForm.tsx
        ProjectStatusBadge.tsx
        ProjectColorPicker.tsx
        ProjectReorderList.tsx
        ProjectDeleteDialog.tsx
        ProjectSyncButton.tsx
      github/
        RepoExplorer.tsx
        FileViewer.tsx
        CommitList.tsx
        RouteList.tsx
        SyncStatusIndicator.tsx
```

---

## Key Architecture Decisions

1. **Query params for GitHub routes** (`/api/github/tree?repo=X`) — avoids SPA catch-all collision
2. **PostgreSQL caching** instead of Redis — one less dependency, sufficient for this scale
3. **Singleton Octokit** — one instance, owner from `GITHUB_OWNER` env var
4. **TanStack Query** on frontend — built for server-state with optimistic updates
5. **Slug-based URLs** (`/projects/swipesblue`) — readable, stable
6. **Soft delete by default** — archive, don't destroy
7. **Modular route files** — not one monolithic routes.ts

---

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| DATABASE_URL | Yes | — |
| GITHUB_TOKEN | Yes | — |
| GITHUB_OWNER | Yes | 53947 |
| CONSOLE_API_KEY | Yes | — |
| SESSION_SECRET | Yes | — |
| CACHE_TTL_DEFAULT | No | 300 |
| SYNC_INTERVAL_MINUTES | No | 30 |

---

## Asset Management Plan

### Current Problem

Every Replit project dumps images into `attached_assets/` with auto-generated filenames containing spaces and timestamps (e.g., `Blueprint Icon_1760810447789.png`). linkblue alone has **325 files totaling 88.7 MB** in this directory, with many duplicates of the same image at different timestamps. Images break in production because:

1. **Spaces in filenames** cause URL encoding issues in production builds
2. **Duplicate files** — same asset exists 2-5 times with different timestamps
3. **No organization** — icons, logos, screenshots, PDFs, videos all dumped flat
4. **Bloated git repos** — 88+ MB of binaries tracked in git
5. **Fragile imports** — components import by exact timestamped filename (`@assets/Blueprint Icon_1760810447789.png`)

### Solution: Structured Asset Directory

Replace `attached_assets/` with a clean `client/public/assets/` structure:

```
client/public/assets/
  brands/
    triadblue/
      icon.png              # 48x48 favicon/icon
      logo.png              # Full logo with text
      wordmark.png          # Text-only logo
    consoleblue/
      icon.png
      logo.png
    linkblue/
      icon.png
      logo.png
    hostsblue/
      icon.png
      logo.png
    swipesblue/
      icon.png
      logo.png
    businessblueprint/
      icon.png
      logo.png
      avatar.png
    scansblue/
      icon.png
      logo.png
  products/
    inbox/
      icon.png
      logo.png
      logo-blue.png
    send/
      icon.png
      logo.png
      logo-blue.png
    livechat/
      icon.png
      logo.png
      logo-blue.png
    content/
      icon.png
    commverse/
      icon.png
  icons/
    local-seo.png
    reputation-mgmt.png
    social-media-mgmt.png
    ai-coach.png
    digital-assessment.png
    settings.png
    captaining.png
    digital-path.png
  ui/
    placeholder.svg          # Standard placeholder for missing images
    loading-spinner.svg
```

### Asset Registry (TypeScript constants)

A single source of truth for all asset paths, replacing scattered `@assets/` imports:

```typescript
// client/src/lib/assets.ts
const BASE = '/assets';

export const BRAND_ASSETS = {
  triadblue:        { icon: `${BASE}/brands/triadblue/icon.png`, logo: `${BASE}/brands/triadblue/logo.png` },
  consoleblue:      { icon: `${BASE}/brands/consoleblue/icon.png`, logo: `${BASE}/brands/consoleblue/logo.png` },
  linkblue:         { icon: `${BASE}/brands/linkblue/icon.png`, logo: `${BASE}/brands/linkblue/logo.png` },
  hostsblue:        { icon: `${BASE}/brands/hostsblue/icon.png`, logo: `${BASE}/brands/hostsblue/logo.png` },
  swipesblue:       { icon: `${BASE}/brands/swipesblue/icon.png`, logo: `${BASE}/brands/swipesblue/logo.png` },
  businessblueprint:{ icon: `${BASE}/brands/businessblueprint/icon.png`, logo: `${BASE}/brands/businessblueprint/logo.png` },
  scansblue:        { icon: `${BASE}/brands/scansblue/icon.png`, logo: `${BASE}/brands/scansblue/logo.png` },
} as const;

export const PRODUCT_ASSETS = {
  inbox:    { icon: `${BASE}/products/inbox/icon.png`, logo: `${BASE}/products/inbox/logo.png` },
  send:     { icon: `${BASE}/products/send/icon.png`, logo: `${BASE}/products/send/logo.png` },
  livechat: { icon: `${BASE}/products/livechat/icon.png`, logo: `${BASE}/products/livechat/logo.png` },
  content:  { icon: `${BASE}/products/content/icon.png` },
  commverse:{ icon: `${BASE}/products/commverse/icon.png` },
} as const;

export const ICON_ASSETS = {
  localSeo: `${BASE}/icons/local-seo.png`,
  reputationMgmt: `${BASE}/icons/reputation-mgmt.png`,
  socialMediaMgmt: `${BASE}/icons/social-media-mgmt.png`,
  aiCoach: `${BASE}/icons/ai-coach.png`,
  settings: `${BASE}/icons/settings.png`,
} as const;

export const PLACEHOLDER = `${BASE}/ui/placeholder.svg`;
```

### SafeImage Component

A drop-in `<img>` replacement that handles loading failures gracefully:

```typescript
// client/src/components/ui/safe-image.tsx
// - Shows a subtle placeholder on error (not a broken image icon)
// - Supports lazy loading
// - Logs missing assets to console in dev mode
// - Falls back to brand color circle with initials when no image
```

### Migration Steps

1. **Audit** — deduplicate `attached_assets/`, identify the canonical version of each image
2. **Rename & organize** — copy canonical images to `client/public/assets/` with clean kebab-case names, no spaces, no timestamps
3. **Create asset registry** — `client/src/lib/assets.ts` with typed constants
4. **Create SafeImage component** — handles broken images gracefully
5. **Update all imports** — replace `import x from "@assets/Long Name_12345.png"` with imports from the asset registry
6. **Remove `attached_assets/`** — delete from repo, remove `@assets` Vite alias
7. **Add to .gitignore** — prevent `attached_assets/` from coming back

### Database Asset Tracking (projects table)

Each project in the `projects` table already has `icon_url` — this stores the path to the project's icon from the organized asset directory. The asset registry provides defaults; the database allows overrides.

### Rules Going Forward

- No spaces in filenames — kebab-case only
- No timestamps in filenames
- One canonical version of each asset
- All assets in `client/public/assets/` (served statically, no Vite import needed)
- All asset references go through the registry or database
- SafeImage component used everywhere instead of raw `<img>`

---

## Migration Phases

1. **Database foundation** — schema, migrations, seed data
2. **Asset cleanup** — deduplicate, rename, organize into `client/public/assets/`, create registry + SafeImage component
3. **Server routes** — services, middleware, CRUD endpoints
4. **Frontend project management** — hooks, components, pages (using new asset system)
5. **GitHub integration** — explorer, sync job, cache
6. **Vercel elimination** — consolidate to single Express app
7. **Testing and polish**
