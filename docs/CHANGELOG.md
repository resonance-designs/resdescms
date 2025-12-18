# Changelog

## v0.2.5 (alpha)
-   Sidebar builder now supports a single-column layout with configurable width and placement controls presented side-by-side.
-   PageBuilder UX: you can remove individual elements without deleting entire blocks; plugin element settings (e.g., GitLink display mode) show when provided by the plugin.
-   Plugin elements lazy-load their renderers; GitLink block self-fetches repos on the frontend using the public endpoint with an auth fallback to avoid “unsupported element” states.

## v0.2.4 (alpha)
-   Security Hardening: Comprehensive security fixes across all plugins and core systems
-   Path Traversal Prevention: Added slug validation to prevent directory traversal attacks in plugin operations
-   OAuth Security: Fixed critical OAuth implementation bug in RDCommerce (proper client_secret usage)
-   Memory Leak Prevention: Added TTL cleanup for OAuth state storage to prevent unbounded memory growth
-   Transactional Safet: Wrapped post metadata operations in database transactions for data integrity
-   Authentication Fixes: Added missing JWT headers to all plugin API calls
-   Input Validation: Enhanced slug generation and required field validation
-   Plugin State Consistency: Fixed plugin activation to run install scripts before marking active
-   XSS Protection: Added URL validation and type safety improvements across plugins
-   Static File Security: Removed server-side code exposure via static file serving

## v0.2.3 (alpha)
-   Plugin added: RDCommerce (Ecommerce Integration); Complete Square payment processor integration with OAuth authentication, inventory import with date/stock filters, and full product management interface. Supports sandbox/production modes with developer toggle. Products stored as posts with metadata (SKU, price, stock, Square ID). Self-contained plugin with no core CMS modifications.

## v0.2.2 (alpha)
-   Plugin system enhanced: GitLink and GLink plugins made fully self-contained with generic plugin data loading, shortcode context, and client script injection interfaces. No hardcoded plugin references in core application code.

## v0.2.1 (alpha)
-   Plugin added: GitLink (GitHub Linking); OAuth configurable from the admin UI (Client ID/Secret/redirect).
-   Plugin admin UIs load from plugin manifests (`adminView`), keeping plugin frontends (e.g., GLink/GitLink) inside each plugin directory. GLink now supports optional admin tracking toggle and testing mode for GA tags.
-   Plugin elements/shortcodes now come from plugin manifests (e.g., GitLink registers the “GitHub Repos” block and `[gitlink]` shortcode).

## v0.2.0 (alpha)

-   Plugin architecture mounts plugin routes from `server/plugins/<slug>/routes.js`; admin menus render only when the plugin is active (no plugin code in core). Multiple plugins can be active simultaneously.
-   Plugin system shipped with GLink (Google Analytics/AdSense); OAuth configurable from the admin UI (Client ID/Secret/redirect) with account/property selection. Account/property/stream picker, testing-mode GA tag injection.
-   Plugin admin: deactivate hides routes/menus; delete supports removing files and (optionally) data via confirm modal.

## v0.1.4 (alpha)

-   Added WordPress-style shortcodes for posts/pages/media in content (post/page `target` option for link display).
-   Documentation moved to `/docs` with updated links and architecture diagram cleanup.
-   Database refactor: all tables now prefixed with `rdcms_`, posts get `post_type`, and new `rdcms_postmeta` supports extensible content metadata.


## v0.1.3 (alpha)

-   Centralized API base handling and added post-by-slug endpoint/usage.
-   Shared media URL resolver and ElementRenderer to keep frontend/admin rendering consistent.
-   Navigation hardening (menu validation, slug generation guard).

## v0.1.2 (alpha)

-   Added multiple navigation menus with per-item targets; updated admin Navigation UI and menu element rendering (horizontal/vertical).
-   Added menu block to page builder; frontend resolves media URLs via API base.
-   Fixed SPA navigation to reload content on slug changes for pages/posts.
-   Improved media URL handling for split frontend/backend origins.

## v0.1.1 (alpha)

-   Added theme management with header/body/footer/sidebar builders and per-section spacing/border settings.
-   Added container spacing/border controls in Theme Management; updated frontend rendering to apply them.
-   Introduced page builder layouts rendering on the frontend; header/footer layouts now render as well.
-   Added media-library selection/upload for logo and favicon.
-   Added typography dropdowns with custom font upload support.
-   Added Posts element type and posts/category defaults seeded; home page slug moved to CMS settings.
-   Fixed padding resolution and CSS var handling; added container, header, footer, sidebar settings to theme schema.

## v0.1.0 (alpha)

-   Initial alpha release of ResDesCMS with posts, pages, categories, media, navigation, and settings.
-   Added JWT-based admin authentication and Vue 3 + Vite frontend.
-   Introduced basic theme support with bundled `resdes-basic` theme and CSS variable wiring.
