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


# Sprint 11 — Phase 2
## Full CRUD UI Pipeline

### Objective
Implement interactive post creation and post deletion pipelines in the React frontend, updating UI state without browser reloads and handling asynchronous submitting/deleting states and error handling.

### POST Integration & Form Implementation
- Created controlled input form in `src/App.jsx` for `title` and `content`.
- Implemented client-side validation to reject empty submissions.
- Added `createPost()` in `src/services/api.js` targeting `POST http://localhost:5000/posts`.
- Displayed `isSubmitting` loading state (`"Creating..."`) and disabled form controls during submission.
- On success, dynamically prepends the created document to the `posts` state array and resets form fields.

### Delete Integration & Safety
- Added `deletePost()` in `src/services/api.js` targeting `DELETE http://localhost:5000/posts/:id`.
- Integrated `window.confirm()` verification before executing destructive operations.
- Handled per-item `deletingId` loading indicator (`"Deleting..."`).
- On successful deletion, filtered the removed post from `posts` state without full page reloads.

### Error Handling & Edge Cases
- Handled server errors gracefully with dedicated `formError` and `deleteError` state variables.
- Deleting the final post automatically transitions the UI into the `"No posts available."` empty state.

### Testing & Verification
- Tested creating valid posts: document persisted in MongoDB Atlas and rendered immediately.
- Tested submitting empty forms: validated on client without unnecessary network requests.
- Tested deleting posts: confirmed in prompt, document removed from MongoDB Atlas, and item removed from UI.
- Tested deleting all posts: empty state rendered correctly.
- Verified Network tab: `POST /posts` returns `201` and `DELETE /posts/:id` returns `200`. Zero console errors.

# Sprint 11 — Phase 3C: Frontend Image Upload Integration

## Objective
Integrate optional image file uploads into the React post creation form using `FormData`, allowing users to select an image file that is streamed through the Express backend to Cloudinary, with the resulting `imageUrl` rendered in the post list without requiring full page reloads.

## Architecture & Implementation
- **API Service**: Updated `createPost(formData)` in `src/services/api.js` to accept `FormData` without setting manual `Content-Type` headers, enabling the browser to construct standard multipart boundaries.
- **Form State**: Added `image` state and file input (`accept="image/*"`) with client-side image type and 5 MB size validation.
- **Payload Construction**: Appends `title`, `content`, and optionally `image` (under field name `image`) to a `FormData` object.
- **Post Card Image Display**: Conditionally renders `<img src={post.imageUrl} />` with responsive styling for posts that have a valid Cloudinary URL.
- **Form Reset**: Clears `title`, `content`, `image` state, and the file input DOM ref upon successful upload.

## Testing & Verification
- Tested creating post without image: saved with `imageUrl: null` and rendered title/content cleanly.
- Tested creating post with image: uploaded via backend to Cloudinary, returned `imageUrl`, and immediately displayed the image banner in the post card.
- Inspected Network tab: `POST /posts` sent `multipart/form-data` payload returning `201 Created`.
- Verified delete action and empty states remain fully operational without console errors.

# Sprint 12 — Track B — Phase 1B: WebSocket Initialization & Base MVP: React Client Connection

## Prompt
Sprint 12 — Track B — Phase 1B
WebSocket Initialization & Base MVP: React Client Connection
[Attached full system prompt specification]

## Objective
Integrate `socket.io-client` into the React application, establish a persistent WebSocket connection to the backend using `VITE_API_URL`, ensure lifecycle-aware connection and cleanup in `useEffect`, and preserve all existing REST API and Cloudinary features.

## Architecture & Implementation
- **Dependencies**: Added `socket.io-client`.
- **Socket Client Module**: Created `src/services/socket.js` exporting a configured `socket` instance with `autoConnect: false` and `withCredentials: true`.
- **React Connection Lifecycle**: In `src/App.jsx`, added a dedicated `useEffect` executing `socket.connect()`, listening to `connect`, `disconnect`, and `connect_error` events.
- **Cleanup Strategy**: On component unmount / StrictMode cleanup, removes all attached event listeners (`socket.off(...)`) and invokes `socket.disconnect()`, eliminating duplicate connection accumulation.

## Testing & Verification
- Started backend (`the-data-hub`) on port 5000 and frontend (`Cine-Stream`) on port 5173.
- Checked Browser Console: Confirmed `Socket connected: <socket_id>`.
- Checked Backend Terminal: Confirmed `Socket client connected: <socket_id>`.
- Refreshed browser multiple times: Confirmed disconnect and reconnect cycles execute cleanly without hanging sockets.
- Verified REST endpoints (`GET /posts`, Create Post with image, Delete Post) continue to work normally.



# Sprint 12 — Track B — Phase 1C: Bidirectional Broadcast: Real-Time Messaging MVP

## Prompt
Sprint 12 — Track B — Phase 1C
Bidirectional Broadcast: Real-Time Messaging MVP
[Attached full system prompt specification]

## Objective
Implement a real-time messaging UI in React that emits `chat:message` events over Socket.io and receives broadcasted messages in real time without page reload.

## Implementation Details
- Added `messages` and `messageInput` state in `src/App.jsx`.
- Attached `socket.on('chat:message', handleChatMessage)` with proper `socket.off()` cleanup inside `useEffect`.
- Implemented `handleSendMessage` that checks for empty text, emits payload, and clears input.
- Rendered live community chat container above the blog posts list.


# Sprint 12 — Track B — Phase 2A: Session Identification

## Prompt
Sprint 12 — Track B — Phase 2A
Session Identification
[Attached full system prompt specification]

## Objective
Prompt user for a unique session username on mount, enforce non-empty input, include identity in Socket.io `chat:message` payloads, and render `[Username]: Message` in real time.

## Implementation Details
- Added `window.prompt` workflow on mount storing non-empty name in `username` state.
- Emitted `chat:message` with `{ user: username, text }`.
- Rendered messages as `[msg.user]: msg.text` in the UI.

# Sprint 12 — Track B — Phase 2B: Real-Time Event Handlers: Typing Indicator

## Prompt
Sprint 12 — Track B — Phase 2B
Real-Time Event Handlers: Typing Indicator
[Attached full system prompt specification]

## Objective
Implement debounced typing detection and real-time indicator display in React when other users type in the chat input.

## Implementation Details
- Emits `user:typing` (`isTyping: true`) on input changes with a 1.5s debounce timeout to automatically emit `isTyping: false`.
- Listens to `socket.on('user:typing')`, managing active typing users in `typingUsers` state.
- Rendered `[User] is typing...` indicator in the live chat section.
- Added comprehensive timer and listener cleanup on unmount.

# Sprint 12 — Track B — Phase 3: Channel Segregation & Routing Logic

## Prompt
Sprint 12 — Track B — Phase 3
Channel Segregation & Routing Logic
[Attached full system prompt specification]

## Objective
Implement a channel selector UI in React with `General` and `Tech Support` rooms, emitting `channel:join` on channel switch and routing message and typing payloads strictly within the active channel.

## Implementation Details
- Added `currentChannel` state and interactive channel selector tabs (`# General`, `# Tech Support`).
- Emits `channel:join` upon connection and channel selection.
- Attaches `channel` property to `chat:message` and `user:typing` payloads.
- Filters messages and typing indicators so only events matching the active channel appear in the DOM.