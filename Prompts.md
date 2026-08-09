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

### Objective
Implement automatic 500ms debounced movie search without external libraries, while maintaining full compatibility with infinite scroll.

### How Debounce Works
1. `SearchBar.jsx` maintains an internal `searchTerm` state for immediate input feedback.
2. A `useEffect` hook listening to `searchTerm` initiates a native `setTimeout` for 500ms.
3. Every new keystroke triggers effect cleanup (`clearTimeout`), resetting the timer.
4. After 500ms of inactivity, `onSearch(searchTerm)` is invoked.
5. Form submit (Enter key) or "Clear" button triggers `onSearch` immediately and bypasses the timer.

### Race-Condition & Stale Request Handling
- `HomePage.jsx` uses `activeControllerRef` (`AbortController`). When a new debounced search is triggered, any pending in-flight request is aborted at the browser level.
- Sequence tracking (`requestIdRef`) discards out-of-order payloads.

### Infinite Scroll Compatibility
- When a debounced query fires, `page` resets to 1, `movies` resets, and `hasMore` resets to `true`.
- Scrolling down triggers `IntersectionObserver`, fetching `page=2`, `page=3`, etc., passing the active `searchQuery`.

### Tests Performed
1. **Debounce Verification**: Typed "batman" slowly without pressing Enter -> verified exactly 1 request for `/search/movie?query=batman&page=1` after 500ms pause.
2. **Rapid Typing**: Typed "spiderman" quickly -> verified only 1 final request for `query=spiderman&page=1`.
3. **Query Change**: Typed "Batman", then immediately "Avatar" -> verified "Batman" request was aborted and only "Avatar" results rendered.
4. **Infinite Scroll on Search**: Searched "Batman" -> scrolled -> verified `page=2` and `page=3` of "Batman" loaded seamlessly.
5. **Clear Search**: Cleared input -> immediately returned to `/movie/popular?page=1` with infinite scroll continuing on popular movies.