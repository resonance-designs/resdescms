# Resonance Designs CMS - Setup & Running Guide

## Overview
ResDesCMS is a Vue 3 + Vite frontend with an Express.js + SQLite backend. It ships with a WordPress-style theme system (uploadable ZIPs with `functions.js` manifests), header/body/footer/sidebar builders, and a grid-based page builder for content blocks and elements.

## Prerequisites
- Node.js v16+ (Node 18+ recommended)
- npm (comes with Node)

## Installation
Dependencies are committed. If you need to reinstall:
```bash
npm install
```

## Running the CMS
Use two terminals:
1) **Backend**
```bash
npm run server
```
Starts Express on `http://localhost:3001` and initializes `server/cms.db` if missing.

2) **Frontend**
```bash
npm run dev
```
Starts Vite on `http://localhost:5173`.

If your frontend and backend run on different origins/ports, create a `.env` in the project root with:
```bash
VITE_API_BASE=http://localhost:3001
```
Restart `npm run dev` after setting this so media URLs and API calls resolve correctly.

## Default Admin Credentials
- Username: `resonancedesigns`
- Password: `i4Vc$oUU%AR!WK3W`

## Directory Structure (high level)
- **/src**
  - `views/` – Frontend pages (public + admin)
  - `components/` – Reusable Vue components and builders
  - `stores/` – Pinia stores (auth, content, theme)
  - `router/` – Vue Router config
- **/server**
  - `index.js` – Express entry
  - `db.js` – SQLite bootstrap
  - `routes/` – API routes (auth, posts, pages, media, navigation, themes, design)
  - `services/` – Theme and design services
  - `uploads/` – Media library storage
  - `themes/` – Installed themes (e.g., `resdes-basic`)

## Key Features
- Posts, pages, categories, navigation menus, media library
- Multiple navigation menus with per-item targets; menu block element for layouts (horizontal/vertical)
- Theme management (upload/activate ZIP themes) with per-section spacing, borders, and color/font settings
- Grid-based page builder with draggable/resizable blocks and elements (text, media, gallery, posts, etc.)
- Header/footer/sidebar builders in theme settings
- Admin panel with JWT auth and Pinia state
- Tailwind CSS with theme tokens for styling

## Theme Workflow
- Upload a theme ZIP in **Admin -> Design -> Theme**; it is extracted to `server/themes/<slug>` and registered.
- Activate a theme from the Theme tab; its stylesheet is injected automatically.
- Customize header/body/footer/sidebar spacing, borders, and fonts from the Theme tabs; build header/footer/sidebar layouts with the builder.
- Build pages with the page builder; choose a home page slug in **Settings**.

## API Endpoints (core)
- `POST /api/auth/login`
- CRUD for posts: `/api/posts`
- CRUD for pages: `/api/pages`
- Media: `/api/media`, `/api/media/upload`
- Navigation: `/api/navigation`
- Themes: `/api/themes`, `/api/themes/active`, `/api/themes/upload`
- Design settings: `/api/design`

## Environment Variables
Create `.env` (backend):
```
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
NODE_ENV=development
```

## Security Checklist
- Change `JWT_SECRET` and the default admin password before production.
- Serve over HTTPS; configure CORS for your domain.
- Consider rate limiting and stronger password policies.

## Styling Notes
- Tailwind CSS is the base layer.
- Theme settings are written to CSS variables `--theme-*` and applied to layout sections.
- Custom fonts can be uploaded in Theme settings and selected from typography dropdowns.

## Troubleshooting
- **Ports in use**: change frontend port in `vite.config.js`; backend via `PORT` env var.
- **Database issues**: delete `server/cms.db` to recreate (will reset data).
- **CORS issues**: ensure frontend/backends are running on expected ports and proxy config is correct.

## Next Steps
1. Run backend and frontend.
2. Log in at `/admin/login` with the default credentials.
3. Upload or activate a theme in **Design -> Theme**.
4. Configure design settings (logo, favicon, colors, spacing, fonts) and build header/footer/sidebar layouts.
5. Build pages with the page builder and publish.
6. Adjust navigation in **Navigation** and set the home page slug in **Settings**.
