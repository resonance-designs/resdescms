# ResDesCMS
Version: **alpha** | Latest release: v0.1.1

## About
A modern, full-featured CMS built with Vue 3 + Vite, Express.js, and SQLite.

**See [SETUP_GUIDE.md](SETUP_GUIDE.md) for installation and running instructions.**

## Quick Start
1. **Start the backend**: `npm run server`
2. **Start the frontend**: `npm run dev`
3. **Login**: Visit `/admin/login` with credentials:
   - Username: `resonancedesigns`
   - Password: `i4Vc$oUU%AR!WK3W`

## Features
- Posts, pages, categories, navigation, media library
- Theme system with header/body/footer/sidebar builders and per-section spacing/borders
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
- See [THEMEDEV.md](THEMEDEV.md) for theme authoring details.

## Changelog
### Latest Updates
- v0.1.1 (alpha): Theme builders (header/footer/sidebar/body), container spacing/borders, media selection for logo/favicon, typography dropdown + custom fonts, Posts element, default posts/pages seeding, home page slug moved to CMS settings, padding/CSS var fixes.

See [CHANGELOG.md](CHANGELOG.md) for full update logs.
