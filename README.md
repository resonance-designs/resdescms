# ResDesCMS
Version: **alpha** | Latest release: v0.2.2

## About
A modern, full-featured CMS built with Vue 3 + Vite, Express.js, and SQLite.

**See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for installation and running instructions.** For a system overview, check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick Start
1. **Start the backend**: `npm run server`
2. **Start the frontend**: `npm run dev`
3. **Login**: Visit `/admin/login` with credentials:
   - Username: `resonancedesigns`
   - Password: `i4Vc$oUU%AR!WK3W`

## Features
- Posts, pages, categories, navigation menus, media library
- Multiple navigation menus with per-item targets; menu block element for layouts (horizontal/vertical)
- Theme system with header/body/footer/sidebar builders and per-section spacing/borders
- Extensible content via `post_type` and post metadata (rdcms_postmeta) for plugin-style additions
- Plugin system with upload/activate workflow and bundled GLink plugin (Google Analytics/AdSense) configurable entirely from the admin UI
- WordPress-style shortcodes for posts/pages/media in rich content
- Admin panel with JWT auth and Pinia state
- Tailwind CSS styling with custom theme tokens
- SQLite-backed Express API

## Stack
- **Frontend**: Vue 3, Vue Router, Pinia, Vite
- **Backend**: Express.js, SQLite
- **Styling**: Tailwind CSS
- **Authentication**: JWT with bcryptjs

## Theme system (WordPress-style)
- Themes live under `server/themes/<slug>` and expose a `functions.js` (or `theme.json`) manifest with `name`, `slug`, `version`, `author`, `description`, `style`, `defaultSettings`, and `settingsSchema`.
- Each theme should include its own CSS (referenced by `style`) and can rely on settings as CSS variables written to `--theme-<key>`. Theme builders define header/footer layouts; per-section padding/margin/border settings are stored with the active theme.
- Install a theme by uploading a `.zip` (containing `functions.js` + assets) from **Admin -> Design -> Theme**. The backend unzips to `server/themes/<slug>`, registers the manifest in SQLite, and serves assets from `/themes/<slug>/...`.
- Activate a theme in the Theme tab; the active theme's stylesheet is injected automatically on page load and settings are persisted in SQLite.
- Sample bundled theme: `server/themes/resdes-basic` showing CSS variables, settings schema, and header/footer layouts.
- See [docs/THEMEDEV.md](docs/THEMEDEV.md) for theme authoring details.

## Media & API base
- Media uploads are served from the API (`/uploads/<file>`). If your frontend and backend run on different origins, set `VITE_API_BASE` to the API origin (e.g., `http://localhost:3001`) in your `.env` and restart `npm run dev` so media URLs and API calls resolve correctly.

## Plugins
- Upload/activate plugins under **Admin -> Plugins**. Plugins mount their own API routes from `server/plugins/<slug>/routes.js` and expose admin menu items from their manifest (only shown when active).
- Bundled examples:
  - **GLink** (Google Analytics/AdSense): Configure via admin (Client ID/Secret + redirect URI), connect to Google, pick account/property/stream, and optionally enable testing mode or “Track Admin Usage” to inject GA on admin routes. Optional env vars (`GLINK_CLIENT_ID`, `GLINK_CLIENT_SECRET`, `GLINK_REDIRECT_URI`) are supported but UI settings take priority.
  - **GitLink** (GitHub): Self-contained plugin for GitHub integration - connect via OAuth to list repos, render via `[gitlink mode="small-list|medium-list"]` shortcode or the "GitHub Repos" block element. Optional env vars (`GITLINK_CLIENT_ID`, `GITLINK_CLIENT_SECRET`, `GITLINK_REDIRECT_URI`) are supported but UI settings take priority.
- Plugin admin UIs are loaded from each plugin's manifest (`adminView`), keeping plugin frontends bundled with the plugin.

## Shortcodes
- `[post slug="welcome-to-resdescms" display="full|medium|small|link" target="same|new"]` renders a post snippet or link (`target` only applies to `display="link"`; defaults to same tab).
- `[page slug="about" display="link" target="same|new"]` renders a link to a page by slug (`target` optional, defaults to same tab).
- `[media id="5" width="300px"]` renders an image from the media library (width optional).

## Changelog
### Latest Updates
- v0.1.2 (alpha): Navigation menus (multiple, per-item targets), menu block element with orientation, media URL fixes for split frontend/backend hosts.
- v0.1.1 (alpha): Theme builders (header/footer/sidebar/body), container spacing/borders, media selection for logo/favicon, typography dropdown + custom fonts, Posts element, default posts/pages seeding, home page slug moved to CMS settings, padding/CSS var fixes.

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for full update logs.
