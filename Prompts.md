# Documentation — Cine-Stream

## Session 1: Phase 1 Foundation
Established React/Vite foundation, TMDB API service (`tmdbService.js`), popular movies, search submission, movie cards, and state handling.

---

## Session 2: Infinite Scroll Implementation
Implemented infinite scroll using native `IntersectionObserver` with deduplication and separate Page 1 vs Page 2+ UI states.

---

## Session 3: Debugging Duplicate Page 1 API Requests
Resolved React 18 StrictMode double-effect execution by integrating `AbortController` signals into `tmdbService.js` and `HomePage.jsx`.

---

## Session 4: 500ms Debounced Search Implementation
Implemented automatic 500ms debounced movie search without external packages using standard React hooks and `setTimeout` cleanup.

---

## Session 5: Persistent Movie Favorites Implementation
Implemented `localStorage` persistence, `FavoritesContext` state synchronization across routes, and a dedicated `/favorites` route.

---

## Session 6: Lazy Loading of Movie Poster Images
Implemented native browser `loading="lazy"` attributes on poster images with `aspect-ratio: 2 / 3` layout preservation.

---

## Session 7: AI Mood Matcher Foundation
Integrated Google Gemini API (`gemini-1.5-flash`) to process natural-language user moods and return 3-5 movie title recommendations.

---

## Session 8: Gemini → TMDB → MovieCard Integration

### Objective
Connect Gemini's 3-5 recommended movie title strings to real TMDB movie objects, rendering them using the existing `MovieGrid` and `MovieCard` components.

### Matching Strategy
1. Gemini generates 3-5 movie title strings.
2. `tmdbService.searchMovieByTitle(title)` queries TMDB's `/search/movie` endpoint concurrently (`Promise.all`).
3. Selection logic prefers exact title matches (case-insensitive) or falls back to top search results.
4. Missing matches (`null`) are filtered out cleanly without breaking the grid or rendering fake objects.
5. Unique movies are deduplicated by TMDB `movie.id`.
6. Matched TMDB objects are passed to `<MovieGrid movies={matchedMovies} />`.

### Integration & Reuse
- **Favorites Integration**: AI-recommended movie cards automatically inherit the favorite heart toggle button and update `localStorage` / `/favorites` route state.
- **Lazy Image Loading**: AI-recommended movie cards automatically retain `loading="lazy"`, image error fallbacks, and `aspect-ratio: 2 / 3` styling.
- **No Infinite Scroll for AI Results**: AI results render as a finite, curated recommendation set without pagination loops.

### Tests Performed
1. **Basic Mood Search**: Submitted "dark psychological thriller" -> Gemini generated titles -> TMDB fetched real movie objects -> displayed `MovieCard` grid.
2. **TMDB Source of Truth**: Verified poster URLs, release dates, ratings, and IDs originate directly from TMDB data.
3. **Favorites Integration**: Favorited an AI-recommended movie -> verified item appeared on `/favorites` and persisted across browser refresh.
4. **Missing Matches**: Tested with obscure title string -> null match filtered out safely while remaining titles rendered.
5. **No Matches Empty State**: Verified "We couldn't find matching TMDB movies..." empty state renders if 0 titles match.
6. **Regression Tests**: Confirmed Popular Movies, 500ms Debounced Search, Infinite Scroll, and Favorites operate without regressions.


___________________________________________________
# Sprint 11 — The Professional Standard

## Track B — Fullstack Integration

## Phase 1 — Network Connection & CORS

### Objective
Integrate the Sprint 8 React (Vite) frontend with the Sprint 10 Node/Express/MongoDB backend, configuring CORS on Express and replacing dummy data with live `GET /posts` data fetching via React's `useEffect`.

### Architecture & Implementation
- **Environment Strategy**: Created `.env` and `.env.example` in frontend declaring `VITE_API_URL=http://localhost:5000`.
- **API Service Layer**: Created `src/services/api.js` exporting `getPosts()` fetching from `${VITE_API_URL}/posts`.
- **Component State**: Implemented `posts`, `loading`, and `error` state handling inside `useEffect`.
- **Backend CORS**: Installed `cors` and registered middleware in `server.js` allowing origin `http://localhost:5173`.

### Testing & Verification
- Started backend on `http://localhost:5000` and frontend on `http://localhost:5173`.
- Verified Network tab: Request to `GET http://localhost:5000/posts` returned `200 OK` with JSON array.
- Tested Loading state: Displays `"Loading posts..."` during network latency.
- Tested Empty state: When MongoDB collection has no documents, displays `"No posts available."`.
- Tested Error state: When backend is stopped, displays `"Unable to load posts. Please try again."`.
- Confirmed zero CORS errors or unhandled promise rejections in browser console.

### Debugging
Verified that `cors` middleware is placed before all route declarations in `server.js` so preflight and standard requests receive the appropriate headers.