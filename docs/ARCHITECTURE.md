# ResDesCMS Architecture

## Overview

Single-repo CMS with a Vue 3 + Vite SPA frontend and an Express + SQLite backend. State is managed with Pinia; themes and layouts drive rendering via stored JSON and CSS variables. Media and themes are served by the backend.

## Diagram (logical)

```text
┌─────────────────────┐        HTTP/JSON        ┌─────────────────────┐
│  Vue 3 SPA (Vite)   │  ───────────────────▶   │  Express API        │
│  - Router/Pinia     │   fetch/axios           │  - Routes: auth,    │
│  - Page/PageBuilder │                         │    posts, pages,    │
│  - Admin views      │  ◀───────────────────   │    media, nav,      │
└─────────┬───────────┘    responses            │    design, themes   │
          │                                     └─────────┬───────────┘
          │ static assets /themes, /uploads                │
          ▼                                                ▼
┌─────────────────────┐                        ┌─────────────────────┐
│  Browser            │                        │  SQLite (cms.db)    │
│  - Renders SPA      │                        │  - Content tables   │
│  - Loads theme CSS  │                        │  - Navigation menus │
│  - Loads media      │                        │  - Design/theme cfg │
└─────────────────────┘                        └─────────────────────┘
```

## Frontend

- **Frameworks**: Vue 3, Vue Router, Pinia, Vite.
- **State**: `stores/content` (posts/pages/media/navigation menus), `stores/theme`, `stores/auth`.
- **Routing**: public routes `/`, `/page/:slug`, `/post/:slug`; admin under `/admin/*` guarded by auth.
- **Builders**: Page builder grid with blocks/elements; menu element supports selecting a navigation menu and orientation.
- **Theme rendering**: Active theme settings drive CSS variables and header/footer layouts. Layout JSON is parsed and rendered per page/post.
- **Media**: URLs resolved against `VITE_API_BASE` (default `http://localhost:3001`).

## Backend

- **Express** with routes for auth, users, posts, pages, categories, media, navigation menus/items, themes, design settings.
- **Static**: Serves `/uploads` (media) and `/themes/<slug>` assets.
- **Database**: SQLite (`server/cms.db`) with tables for users, posts, pages, media, categories, navigation_menus/navigation_items, settings, design_settings, themes.
- **Navigation**: Multiple menus supported; items can target `_self` or `_blank`. Legacy `navigation` table is migrated into `navigation_items`.
- **Themes**: Upload ZIP, extract to `server/themes/<slug>`, register manifest in DB; active theme stored in SQLite and injected via frontend loader.

## Data flow

1) User visits SPA → Vite serves bundle; Vue Router mounts.
2) Frontend calls Express API (axios) for content, menus, media, theme settings.
3) API queries SQLite; returns JSON. Media/theme assets are served statically.
4) Page/Post views render layout blocks and elements (text, media, gallery, menu, posts, etc.).
5) Admin actions (CRUD posts/pages/media, navigation menus/items, themes/design settings) hit respective routes with JWT auth.

## Build & runtime

- **Dev**: `npm run server` (Express), `npm run dev` (Vite). Use `VITE_API_BASE` if ports differ.
- **Prod**: Build frontend with `npm run build`; serve `dist/` via a static host/proxy to the Express API (ensure `/uploads` and `/themes` are exposed).

## Extensibility Notes

- Add new block/element types via PageBuilder and renderers in `Page.vue`/`Post.vue`.
- Extend navigation by adding menus/items; menu element picks a menu and renders internal/external links respecting targets.
- Themes can extend settings schema; frontend reads theme settings into CSS vars and layout rendering.
