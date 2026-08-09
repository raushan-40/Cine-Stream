# Cine-Stream — Media Explorer

Cine-Stream is a Netflix-style Single Page Application (SPA) built with React and Vite. It consumes the TMDB REST API and Google Gemini AI API to offer movie discovery, infinite scrolling, debounced search, local persistent favorites, and an AI Mood Matcher.

---

## 🌟 Key Features

1. **Movie Discovery & Grid**: View popular movies formatted in a clean, responsive grid layout.
2. **500ms Debounced Search**: Automatically triggers search requests 500ms after the user stops typing, preventing unnecessary API calls while supporting immediate form submission.
3. **Infinite Scroll**: Utilizes the browser's native `IntersectionObserver` API to load additional movie pages as the user scrolls.
4. **Persistent Favorites**: Mark movies as favorites with a single click. Favorites are synchronized across all routes and persisted locally in `localStorage` under `cine-stream-favorites`.
5. **Dedicated `/favorites` Route**: View and manage saved favorite movies on a separate route.
6. **Lazy-Loaded Poster Images**: Uses native browser `loading="lazy"` attributes on poster images with CSS aspect ratio reservations (`aspect-ratio: 2 / 3`) to prevent cumulative layout shift (CLS).
7. **AI Mood Matcher (`/mood`)**: Enter natural-language prompts (e.g. "dark psychological thriller") to receive 3–5 AI-curated movie title recommendations powered by Google's Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`).
8. **Gemini → TMDB Integration**: Converts AI title recommendations into real TMDB movie objects, matching real posters, ratings, and IDs while preserving favorites and lazy image loading.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Routing**: `react-router-dom`
- **State Management**: React State & Context API (`FavoritesContext`)
- **APIs**: The Movie Database (TMDB) REST API, Google Gemini AI REST API
- **Styling**: Standard CSS Grid & Flexbox (Dark Streaming Theme)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18+)
- npm or yarn

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/<YOUR-USERNAME>/cine-stream.git
cd cine-stream
npm install