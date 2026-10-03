### Frontend Documentation (`Cine-Stream/README.md`)
```markdown
# Cine-Stream (Frontend)

## Overview
Fullstack Blog client built with React and Vite, connecting to **The Data Hub** REST API.

## Features
- **Live CRUD UI**: Create and delete posts without page reloads.
- **Image Uploads**: Sends `multipart/form-data` with client validation.
- **Cloud Rendering**: Displays Cloudinary image URLs hosted via the backend.
- **Production Deployment**: Configured for Vercel.

## Required Environment Variables
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Deployed Render Backend API Base URL | `https://the-data-hub.onrender.com` |

## Local Setup
```bash
npm install
npm run dev