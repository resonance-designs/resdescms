# Resonance Designs CMS - Setup & Running Guide

## Overview
This is a full-featured CMS built with Vue 3 + Vite, Express.js, and SQLite, featuring a secure admin panel and WordPress-like content management.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
Dependencies are already installed. If you need to reinstall them:
```bash
npm install
```

### Running the CMS

#### Terminal 1: Start the Backend Server
```bash
npm run server
```
This will start the Express.js backend on `http://localhost:3001`

#### Terminal 2: Start the Frontend Development Server
```bash
npm run dev
```
This will start the Vite frontend on `http://localhost:5173`

## Default Admin Credentials
- **Username**: `resonancedesigns`
- **Password**: `M@1phunkti0n!ng)`

## Directory Structure

### Frontend (`/src`)
- **views/** - Page components (Home, Post, Page, Admin pages)
- **components/** - Reusable Vue components (admin UI components)
- **stores/** - Pinia state management (auth, content)
- **router/** - Vue Router configuration

### Backend (`/server`)
- **index.js** - Express app entry point
- **db.js** - SQLite database setup and utilities
- **middleware/auth.js** - JWT authentication middleware
- **routes/** - API endpoints (auth, posts, pages, media, navigation)
- **uploads/** - Media upload storage directory
- **cms.db** - SQLite database file (auto-created on first run)

## Key Features

### Admin Panel (`/admin`)
- **Dashboard** - Overview statistics and recent content
- **Posts** - Create, read, update, delete blog posts
- **Pages** - Manage static pages
- **Media** - Upload and manage images/files
- **Navigation** - Configure site navigation menu
- **Settings** - Configure site-wide settings

### Frontend
- **Home** - Portfolio showcase (based on original design)
- **Posts** - Dynamically display published blog posts
- **Pages** - Display custom pages
- **Responsive Design** - Works on all devices

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with credentials

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (authenticated)
- `PUT /api/posts/:id` - Update post (authenticated)
- `DELETE /api/posts/:id` - Delete post (authenticated)

### Pages
- `GET /api/pages` - Get all pages
- `GET /api/pages/:id` - Get single page
- `POST /api/pages` - Create page (authenticated)
- `PUT /api/pages/:id` - Update page (authenticated)
- `DELETE /api/pages/:id` - Delete page (authenticated)

### Media
- `GET /api/media` - Get all media
- `POST /api/media/upload` - Upload media (authenticated)
- `DELETE /api/media/:id` - Delete media (authenticated)

### Navigation
- `GET /api/navigation` - Get navigation items
- `PUT /api/navigation` - Update navigation (authenticated)

## Database
The SQLite database is automatically created on first run with the following tables:
- **users** - Admin user credentials
- **posts** - Blog posts
- **pages** - Static pages
- **media** - Uploaded files
- **navigation** - Site navigation items
- **settings** - Site configuration

## Building for Production

### Frontend Build
```bash
npm run build
```
Creates optimized production files in `/dist`

### Frontend Preview
```bash
npm run preview
```

## Security Notes
⚠️ **IMPORTANT**: Before deploying to production:
1. Change the `JWT_SECRET` in `.env` file
2. Use HTTPS for all connections
3. Implement rate limiting
4. Set up proper CORS policies
5. Use environment variables for sensitive data
6. Change the default admin password

## Styling
- **TailwindCSS** - Utility-first CSS framework
- **Custom fonts** - Avant Garde fonts included
- **Theme colors** - Orange (#e06e26), Teal (#319ea4), Dark (#282828)

## Environment Variables
Create or update `.env`:
```
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
NODE_ENV=development
```

## Troubleshooting

### Port Already in Use
If port 3001 or 5173 is already in use, you can change them:
- Frontend: Edit `vite.config.js`
- Backend: Set `PORT` in `.env`

### Database Issues
If you encounter database issues, delete `server/cms.db` and restart the server to recreate it.

### CORS Issues
If you get CORS errors, ensure both the frontend and backend are running and the proxy is configured in `vite.config.js`.

## Next Steps
1. Log in to the admin panel at `/admin/login`
2. Create some posts and pages
3. Customize the home page and navigation
4. Upload media files
5. Publish your content

## Support
For issues or questions, refer to the documentation or check the console for error messages.
