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

### Objective
Optimize image loading so poster images load lazily as they approach the user's viewport, reducing initial network bandwidth and improving perceived performance.

### Approach Selected
1. **Native `loading="lazy"`**: Used the browser-native `loading="lazy"` attribute on `<img />` tags inside `MovieCard.jsx`.
2. **Separation of Concerns**: Avoided attaching `IntersectionObserver` to images to keep the existing infinite scroll observer focused exclusively on pagination.
3. **Zero Cumulative Layout Shift (CLS)**: The CSS rule `.movie-poster-container` enforces `aspect-ratio: 2 / 3` with a background placeholder color, keeping card dimensions fixed before image bytes download.

### Accessibility & Fallback Handling
- **Descriptive Alt Text**: Poster alt text dynamically formats to `Poster for ${title}` (e.g., `Poster for Inception`).
- **Null & Missing Path**: Movies with `poster_path === null` bypass `<img>` rendering and display an accessible fallback placeholder.
- **Network Load Failure**: The `onError` handler sets `imageError = true`, smoothly switching to the placeholder without breaking the card layout or favorite controls.

### Tests Performed
1. **Initial Viewport Load**: Opened Network → Img tab in Chrome DevTools. Verified initial visible posters load cleanly without downloading offscreen images eagerly.
2. **Infinite Scroll & Search Compatibility**: Scrolled down and searched "Batman" -> newly loaded results lazy-load posters seamlessly as they enter the viewport.
3. **Favorites Route**: Visited `/favorites` -> verified saved movie cards automatically utilize native lazy loading via the shared `MovieCard` component.