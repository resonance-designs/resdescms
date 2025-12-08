# Changelog

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