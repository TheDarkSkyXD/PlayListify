# Test Plan-- User Story 1.2-- Build Dashboard UI Structure

This document outlines the granular test plan for **User Story 1.2**, which focuses on the initial rendering and structure of the main dashboard UI.

## 1. Scope and Objectives

### 1.1. Targeted User Story

*   **User Story 1.2--** As a user, I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history.

### 1.2. AI-Verifiable End Results (Acceptance Criteria)

This test plan directly targets the following Acceptance Criteria (ACs) from [`docs/specifications/user_stories.md`](docs/specifications/user_stories.md:24)--

*   **AC1--** Navigating to the "Dashboard" view renders the correct components.
*   **AC2--** The dashboard contains two distinct sections with `h2` headers-- "Recent Playlists" and "Continue Watching".
*   **AC3--** When no data is available, these sections must display their specific empty-state messages, verifiable via DOM assertion.

## 2. Test Strategy

### 2.1. Methodology

We will adhere to the **London School of Test-Driven Development (TDD)**. Tests will be written *before* the implementation code. We will focus on testing the observable behavior of the UI from an end-user's perspective. Collaborators (like data-fetching services) will be mocked or stubbed to isolate the UI components and ensure tests are fast, reliable, and focused purely on the component's rendering logic.

### 2.2. Test Environment

*   **Framework--** Playwright
*   **Assertions--** Expect library from Playwright for DOM assertions.
*   **Target--** The tests will run against a live-rendered DOM in a headless browser, simulating real user interactions.

## 3. Granular Test Cases

The following test cases are designed to be atomic and directly verifiable by an AI agent executing the test suite.

### 3.1. Test Cases for AC1-- Dashboard Navigation and Rendering

*   **Test Case 1.1.1-- Verify Dashboard View Activation**
    *   **Description--** This test ensures that clicking the primary navigation element for the dashboard correctly loads the dashboard view into the main content area.
    *   **Precondition--** The application is loaded, and the main layout (including the `#sidebar` and `#main-content` elements) is visible.
    *   **Action--** Simulate a user click on the 'Dashboard' link/button within the `#sidebar`.
    *   **AI-Verifiable Outcome--** Assert that the `#main-content` element has a child element with the ID `#dashboard-view`. This confirms the correct view has been mounted.

### 3.2. Test Cases for AC2-- Section Headers

*   **Test Case 1.2.1-- Verify "Recent Playlists" Header**
    *   **Description--** This test confirms the presence and visibility of the "Recent Playlists" section header.
    *   **Precondition--** The dashboard view is active.
    *   **Action--** None (static check).
    *   **AI-Verifiable Outcome--** Assert that an `h2` element exists within `#dashboard-view` and contains the exact text "Recent Playlists". The assertion should also confirm the element is visible to the user.

*   **Test Case 1.2.2-- Verify "Continue Watching" Header**
    *   **Description--** This test confirms the presence and visibility of the "Continue Watching" section header.
    *   **Precondition--** The dashboard view is active.
    *   **Action--** None (static check).
    *   **AI-Verifiable Outcome--** Assert that an `h2` element exists within `#dashboard-view` and contains the exact text "Continue Watching". The assertion should also confirm the element is visible to the user.

### 3.3. Test Cases for AC3-- Empty State Rendering

*   **Test Case 1.3.1-- Verify "Recent Playlists" Empty State**
    *   **Description--** This test ensures the correct empty-state message is shown when no recent playlist data is available.
    *   **Precondition--** The dashboard view is active. The data source for recent playlists is mocked to return an empty set.
    *   **Action--** None (static check).
    *   **AI-Verifiable Outcome--** Assert that an element with the class `.empty-state-message` exists as a child of the "Recent Playlists" section. Assert that this element contains a `<p>` tag with the exact text "You have no recent playlists.".

*   **Test Case 1.3.2-- Verify "Continue Watching" Empty State**
    *   **Description--** This test ensures the correct empty-state message is shown when no "continue watching" data is available.
    *   **Precondition--** The dashboard view is active. The data source for the watch history is mocked to return an empty set.
    *   **Action--** None (static check).
    *   **AI-Verifiable Outcome--** Assert that an element with the class `.empty-state-message` exists as a child of the "Continue Watching" section. Assert that this element contains a `<p>` tag with the exact text "You have no videos to continue watching.".

## 4. Advanced Testing Strategies

### 4.1. Recursive Regression Testing

All test cases defined in this plan will be added to the `acceptance` test suite. They will be executed automatically on every commit and pull request to ensure that future changes do not break the fundamental structure of the dashboard. A failure in any of these tests will block the integration of new code.

### 4.2. Edge Case Testing

*   **Whitespace Robustness--** Assertions for text content will be configured to trim whitespace to handle cases where developers might inadvertently add spaces inside the `h2` or `p` tags (e.g., `<h2> Recent Playlists </h2>`).
*   **Partial Data--** A test case will be created where the "Recent Playlists" section has data, but "Continue Watching" does not. The test will assert that the empty-state message *only* appears for the "Continue Watching" section. The inverse scenario will also be tested.

### 4.3. Chaos Testing

*   **CSS Failure Simulation--** A test will be run with CSS loading disabled or blocked. The test will not check for styling but will re-verify the DOM structure asserts from section 3. This ensures the application remains structurally sound and readable even if styles fail to apply.
*   **Data Fetching Failure--** A test will simulate a catastrophic failure of the data-fetching mechanisms (e.g., a network error or rejected promise). The test will assert that the UI gracefully handles the error and correctly displays the empty-state messages for both sections, preventing a UI crash.