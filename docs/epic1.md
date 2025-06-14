### **Epic 1: Project Foundation & Playlist Viewing**

**Goal:** Establish the core application shell and enable users to import, view, and search within public YouTube playlists.

---

#### **Story 1.1: Main Application Layout**

**As a user,** I want to see the main application window with the sidebar and top navigation bar so that I can understand the layout and see the main sections of the app.

* **Acceptance Criteria:**
    * The application opens to a primary window.
    * A persistent sidebar is visible on the left.
    * A persistent top navigation bar is visible at the top.
* **Subtasks:**
    * `[ ]` Create a `MainLayout.tsx` component that defines the primary application structure (e.g., sidebar and main content areas).
    * `[ ]` Create a `Sidebar.tsx` component with navigation links for Dashboard, Playlists, History, Downloads, and Settings, each with an appropriate icon.
    * `[ ]` Create a `TopNavbar.tsx` component with placeholders for the `+ Add` button and user avatar.
    * `[ ]` Integrate the Sidebar and TopNavbar components into the `MainLayout.tsx`.
    * `[ ]` Configure the application's router to use this `MainLayout` for all primary views.

---

#### **Story 1.2: Build Dashboard UI Structure**

**As a user,** I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history.

* **Acceptance Criteria:**
    * A "Dashboard" screen must be created with clearly defined sections for "Recent Playlists" and "Continue Watching".
    * These sections must initially display an appropriate empty state (e.g., "Your recent playlists will appear here").
    * The structure must be ready to receive and display real data as soon as the corresponding features (playlist viewing, history tracking) are completed in later stories.
* **Subtasks:**
    * `[ ]` Create the `Dashboard.tsx` page component.
    * `[ ]` Implement the layout for the dashboard to define widget areas.
    * `[ ]` Create a `RecentPlaylistsWidget.tsx` component with a title and "View all" link.
    * `[ ]` Implement the empty state UI for the `RecentPlaylistsWidget`.
    * `[ ]` Create a `ContinueWatchingWidget.tsx` component with a title and "View history" link.
    * `[ ]` Implement the empty state UI for the `ContinueWatchingWidget`.
    * `[ ]` Integrate both widget components into the `Dashboard.tsx` page.

---

#### **Story 1.3: Import Public Playlist**

**As a user,** I want to use the `+ Add` menu to import a public YouTube playlist using its URL, so that the import process starts in the background and I can continue using the app.

* **Acceptance Criteria:**
    * The `+ Add` menu must contain an option labeled "Add Playlist".
    * Clicking this option must open a dialog box for the user to paste a YouTube playlist URL.
    * The URL input field must include an 'x' button that appears when text is present, allowing the user to clear the input with a single click.
    * After a valid URL is entered, the dialog must automatically fetch and display a preview of the playlist (Thumbnail, Title, Video Count, etc.).
    * When the user clicks the final "Import" button in the dialog, the dialog must close immediately, and the import task must instantly appear in the Activity Center.
    * The user must be able to freely navigate the application while the background task is running.
    * Once the background task is complete, the new playlist must appear in the sidebar, and a success notification should be displayed.
* **Subtasks:**
    * `[ ]` Add the "Add Playlist" item to the `+ Add` dropdown menu, which opens the unified `AddPlaylistDialog`.
    * `[ ]` Implement the URL input field UI, including the clear ('x') button on the "Add from YouTube" tab.
    * `[ ]` Create an IPC handler (`playlist:get-preview`) to fetch preview metadata from a URL.
    * `[ ]` Call the preview IPC handler from the dialog and display the returned preview data.
    * `[ ]` Implement the "Import" button to call the main `playlist:import` IPC handler and pass the task to the Activity Center.

---

#### **Story 1.4: View Playlist Details**

**As a user,** I want to select an imported playlist and see the list of all its videos, including thumbnails and titles, so that I can browse its contents.

* **Acceptance Criteria:**
    * Clicking a playlist in the sidebar must display its contents in the main view.
    * The view must show the playlist's header (title, video count, etc.) and a "Last checked" timestamp.
    * Each video in the list must display its Thumbnail, Title, Channel Name, Duration, View Count, Upload Date, a colored status dot, and its downloaded quality (if applicable).
    * A loading state must be shown while data is being fetched.
* **Subtasks:**
    * `[ ]` Create a `PlaylistDetailsView.tsx` component for the main content area.
    * `[ ]` Implement the logic for the component to receive a playlist ID when a playlist is selected.
    * `[ ]` Use a `useQuery` hook to call the `playlist:get-details` IPC handler with the ID.
    * `[ ]` Implement the UI for the playlist header.
    * `[ ]` Create a `VideoListItem.tsx` component to display a single video's information.
    * `[ ]` Map over the fetched data in `PlaylistDetailsView.tsx` and render the `VideoListItem` components.
    * `[ ]` Implement loading and empty state UIs.

---

#### **Story 1.5: Search within Playlist**

**As a user,** I want to search for a specific video by title within a selected playlist so that I can find content quickly.

* **Acceptance Criteria:**
    * A search input field must be present on the playlist detail view.
    * As the user types in the search field, the visible list of videos must filter in real-time to show only videos whose titles match the search query.
* **Subtasks:**
    * `[ ]` Add a search input field UI component to `PlaylistDetailsView.tsx`.
    * `[ ]` Create a local state to hold the search query text.
    * `[ ]` Implement client-side logic to filter the video list based on the search query.
    * `[ ]` Add a debounce to the search input to improve performance.

---

#### **Story 1.6: Infinite Scroll for Video Lists**

**As a user Browse a large playlist,** I want the video list to load more items automatically as I scroll down so that I can view all content without clicking through pages.

* **Acceptance Criteria:**
    * For playlists with a large number of videos (e.g., >100), the UI must not hang or become slow.
    * Only the currently visible video items should be rendered in the DOM.
    * Scrolling must be smooth and performant.
* **Subtasks:**
    * `[ ]` Choose and install a library for list virtualization (e.g., `@tanstack/react-virtual`).
    * `[ ]` Refactor the video list rendering logic in `PlaylistDetailsView.tsx` to use the chosen virtualization library.
    * `[ ]` Test the implementation with a large dataset (e.g., 1000+ items) to ensure performance.