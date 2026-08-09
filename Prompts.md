# Documentation — Cine-Stream

## Session 1: Phase 1 Foundation
Established React/Vite foundation, TMDB API service (`tmdbService.js`), popular movies, search submission, movie cards, and state handling.

---

## Session 2: Infinite Scroll Implementation
Implemented infinite scroll using native `IntersectionObserver` with deduplication and separate Page 1 vs Page 2+ UI states.

---

## Session 3: Debugging Duplicate Page 1 API Requests

### Root Cause Analysis
1. **React 18 StrictMode Re-execution**: React 18 in development mode intentionally mounts, unmounts, and re-mounts components synchronously to verify effect cleanups. Without an `AbortController` signal passed to native `fetch()`, the first mount's network request ran to completion alongside the second mount's network request, creating duplicate `/movie/popular?page=1` requests in DevTools.
2. **Sentinel Observer Guards**: Ensure `IntersectionObserver` does not trigger when `isLoadingInitial` is `true` or when `movies.length === 0`.

### Fix Applied
1. Updated `tmdbService.js` (`request`, `getPopularMovies`, `searchMovies`) to accept an options object containing an `AbortSignal`.
2. Created an `AbortController` inside `HomePage.jsx`'s initial `useEffect` hook. When React StrictMode unmounts during dev verification, `controller.abort()` cancels the obsolete in-flight HTTP request.
3. Handled `AbortError` gracefully in `fetchInitialMovies` to prevent unhandled promise rejections.
4. Strengthened `IntersectionObserver` callback guards in `HomePage.jsx` so it strictly activates only when `!isLoadingInitial`, `movies.length > 0`, and `!isLoadingRef.current`.

### Tests & QA Verification
- **DevTools Network Verification**: Refreshed home page in development mode. Verified exactly 1 completed `/movie/popular?page=1` request.
- **Scroll Verification**: Scrolled down to trigger `/movie/popular?page=2` and `/movie/popular?page=3` sequentially without duplicate requests.
- **Search Verification**: Searched "Batman" and verified a single `/search/movie?query=batman&page=1` request.
- **Build Verification**: Executed `npm run build` successfully without errors.