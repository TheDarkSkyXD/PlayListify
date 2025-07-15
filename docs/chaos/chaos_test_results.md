# Chaos Engineering Report: Main Application Layout (User Story 1.1)

**Date:** 2025-07-05
**Author:** Chaos Engineer AI

## 1. Introduction

This report details the results of chaos engineering experiments performed on the main application layout implemented for User Story 1.1. The objective was to test the resilience of the CSS Grid-based layout under various adverse conditions beyond standard functional testing. The system was tested against extreme viewport sizes, content overflow, and CSS interference.

**Files Under Test:**
*   [`src/index.html`](../../src/index.html)
*   [`src/styles/main.css`](../../src/styles/main.css)

## 2. Experimentation and Outcomes

Three experiments were conducted using a Playwright test script located at [`tests/chaos/main_layout.spec.ts`](../../tests/chaos/main_layout.spec.ts).

### Experiment 1: Extreme Viewport Resizing

*   **Action:** The viewport was programmatically resized to a variety of extreme dimensions, including very narrow (200px width), very short (100px height), and very large (4K resolution).
*   **Hypothesis:** The CSS Grid layout should prevent primary layout elements (`#sidebar`, `#top-nav`, `#main-content`) from overlapping or breaking out of the main `#app-container`.
*   **Verification:** Playwright assertions were used to check if the bounding boxes of the primary layout elements remained within the bounds of the `#app-container`.
*   **Outcome:** **PARTIAL FAILURE**
    *   The layout remained stable for most viewport sizes, including mobile, short, and 4K.
    *   However, the test failed for the `200x1080` (very narrow) viewport. The `#sidebar` element (with a width of 240px) overflowed the `#app-container` (with a width of 200px). This indicates a lack of resilience to extremely narrow screen sizes. The `min-width` property on the sidebar is likely the cause.

### Experiment 2: Content Overflow

*   **Action:** A large volume of text (`'Lorem Ipsum...'` repeated 500 times) was dynamically injected into the `#sidebar` and `#main-content` divs using JavaScript.
*   **Hypothesis:** The layout should handle content overflow gracefully by displaying scrollbars where appropriate, without breaking the overall grid structure.
*   **Verification:** Assertions confirmed that the `scrollHeight` of the containers exceeded their `clientHeight`, indicating that the content was scrollable.
*   **Outcome:** **SUCCESS**
    *   The layout handled the large amount of content as expected. Both the sidebar and main content areas became scrollable, and the overall grid structure was not compromised. The layout is resilient to content overflow.

### Experiment 3: CSS Interference

*   **Action:** Conflicting CSS rules (`display: inline !important;`, `position: absolute !important;`) were injected via a `<style>` tag to simulate conflicts with other stylesheets.
*   **Hypothesis:** The core layout defined by the grid container should resist being completely broken by conflicting child styles.
*   **Verification:** Visual snapshots were taken before and after the CSS injection. Programmatic assertions verified that the primary layout elements remained visible on the page.
*   **Outcome:** **SUCCESS**
    *   While the injected CSS did cause visual disruption (as expected and confirmed by the `conflicting-css.png` snapshot), the fundamental elements did not disappear or cause the application to crash. The test verifying their visibility passed. This shows a degree of resilience, as the layout did not completely collapse.

## 3. Conclusion and Recommendations

The main application layout demonstrates good resilience in handling content overflow and CSS interference. However, a critical weakness was discovered during the extreme viewport resizing experiment.

**Weakness:**
*   **Layout Break on Narrow Viewports:** The layout is not resilient to viewports narrower than the sidebar's minimum width (240px). This causes the sidebar to overflow its container, breaking the intended layout and potentially hiding other content.

**Recommendations:**
1.  **Implement Responsive Sidebar:** The CSS for the `#sidebar` should be updated to be more responsive. Consider using a media query to apply different styles on smaller screens. For example, the sidebar could be collapsed, hidden, or its `min-width` could be removed below a certain viewport width threshold.
    ```css
    /* Example Recommendation */
    @media (max-width: 768px) {
      #sidebar {
        min-width: 180px; /* or consider a different approach */
      }
    }

    @media (max-width: 480px) {
      /* On very small screens, maybe hide the sidebar or make it an overlay */
       #app-container {
        grid-template-columns: 1fr;
        grid-template-areas:
          "top-nav"
          "main-content";
      }
       #sidebar {
        display: none; /* Or position as an overlay */
      }
    }
    ```
2.  **Add Overflow Properties:** As a fallback, ensure the main container has `overflow-x: hidden;` to prevent horizontal scrollbars from appearing when a child element overflows, which can be jarring to the user experience.

The layout is **conditionally resilient**. While it handles some chaotic situations well, the identified weakness in responsiveness should be addressed to ensure a robust user experience across all device sizes.