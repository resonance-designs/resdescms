# Theme Development Guide (ResDesCMS)

This guide explains how to build and package themes for ResDesCMS.

## Theme structure

-   Location: `server/themes/<slug>/`
-   Required manifest: `functions.js` (or `theme.json`)
-   Assets: include your CSS (referenced by `style` in the manifest) and any images/fonts/JS your theme needs.

Example `functions.js`:

```js
export default {  name: 'My Theme',  slug: 'my-theme',  version: '1.0.0',  author: 'You',  description: 'A custom theme',  style: 'style.css',  settingsSchema: [    { key: 'primaryColor', label: 'Primary Color', type: 'color', default: '#e06e26' },    { key: 'maxWidth', label: 'Content Max Width (px)', type: 'number', default: 1200 }    // add your own fields  ],  defaultSettings: {    primaryColor: '#e06e26',    maxWidth: 1200  }}
```

## Settings

-   Keys defined in `settingsSchema` + `defaultSettings` are persisted in the DB and exposed as CSS variables `--theme-<key>` and `--theme-<kebab-key>` on the document root.
-   Common settings in the starter theme: colors, max width, per-section padding/margin, border size/style/color, per-corner radii, header/footer/sidebar toggles and layouts.
-   You can add custom fields (text/number/color/select/textarea); they appear under **Admin → Design → Theme → Management** (for global settings) or the section tabs if you re-use the same keys.

## Layouts

-   Header and Footer layouts are built with the page builder UI and stored in theme settings (`headerLayout`, `footerLayout`). Frontend rendering reads these layouts and renders their blocks/elements.
-   Sidebar placement and body/sidebar visibility are stored as settings (`showHeader`, `showFooter`, `showSidebar`, `sidebarPlacement`); sidebar layouts are single-column (`sidebarLayout`) with configurable width (`sidebarWidth`).

## Packaging and install

-   Zip the theme directory so the root of the zip contains `functions.js` and your assets.
-   Upload the zip from **Admin → Design → Theme → Install Theme**.
-   The server extracts to `server/themes/<slug>`, registers the manifest, and serves assets at `/themes/<slug>/...`.

## Rendering notes

-   Frontend injects the active theme’s `style` as a `<link>` and writes settings to CSS variables.
-   Per-section spacing/border settings are applied inline when rendering pages/posts.
-   Custom elements stored in layouts (text/media/gallery/custom/posts) can be mapped to richer components if you extend the renderer.

## CSS tips

-   Reference CSS vars, e.g. `color: var(--theme-primaryColor);`
-   Expose additional vars in your `style.css` if needed.

## Fonts

-   Admin supports uploading fonts to the media library; dropdowns for primary/heading fonts can include uploaded font files. Ensure your CSS declares `@font-face` if needed.

## Defaults and fallbacks

-   Provide sensible `defaultSettings` so installs work without manual configuration.
-   Keep slugs unique per theme; the manifest `slug` is required.
