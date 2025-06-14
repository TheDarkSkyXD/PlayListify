+++
id = "styling-conventions-v1"
title = "Project Styling Conventions: Tailwind CSS & Shadcn UI"
version = 1.0
status = "draft"
effective_date = "2025-06-13"
scope = "Frontend development, specifically the use of Tailwind CSS and Shadcn UI components within the PlayListify application."
owner = "Frontend Team"
template_schema_doc = ".ruru/templates/toml-md/14_standard_guideline.README.md"
tags = ["styling", "tailwind", "shadcn", "frontend", "conventions", "ui", "css"]
related_docs = [
    "docs/Frontend-Architecture.md",
    "tailwind.config.js",
    "components.json",
    "src/frontend/styles/globals.css"
]
related_tasks = ["SUBTASK-WRITER-StylingDocs-20250613203947"]
+++

# Project Styling Conventions: Tailwind CSS & Shadcn UI (v1.0)

**Status:** draft | **Effective Date:** 2025-06-13 | **Owner:** Frontend Team

## Purpose / Goal 🎯

*   To establish clear, consistent, and maintainable styling practices for the PlayListify application, focusing on the use of Tailwind CSS and Shadcn UI.
*   To ensure all frontend developers adhere to a common set of guidelines, improving code quality, readability, and ease of collaboration.
*   To facilitate efficient development and onboarding of new team members by providing a central reference for styling decisions.

## Scope 🗺️

*   This guideline applies to all frontend code involving styling within the PlayListify application.
*   It covers the configuration and usage of Tailwind CSS utility classes and the integration and customization of Shadcn UI components.
*   Project-specific configurations found in [`tailwind.config.js`](tailwind.config.js:0) and [`components.json`](components.json:0) are integral to these conventions.

## Standard / Guideline Details 📜

### Guideline 1: Tailwind CSS Usage

*   **Description:** General principles for using Tailwind CSS to ensure consistency and maintainability.
*   **Rationale:** Tailwind CSS offers great flexibility. These guidelines help harness that flexibility in a structured way.

*   **Color Palette:**
    *   Utilize the predefined color palette in [`tailwind.config.js`](tailwind.config.js:10) for all color-related styling.
    *   **Primary Colors:** Use `primary` (e.g., `bg-primary`, `text-primary-500`) for main branding elements. The `primary` color is `FF0000` (YouTube Red) with various shades defined.
    *   **Theme-based Colors:**
        *   For dark mode, use the `dark` color set (e.g., `dark:bg-dark-background`, `dark:text-dark-text`). Key colors include `dark.background` (`#181818`), `dark.text` (`#FFFFFF`).
        *   For light mode, use the `light` color set (e.g., `bg-light-background`, `text-light-text`). Key colors include `light.background` (`#FFFFFF`), `light.text` (`#212121`).
    *   **Neutral Colors:** Use the `neutral` color scale (e.g., `border-neutral-400`) for borders, subtle backgrounds, and secondary text. The base neutral is `#AAAAAA` (`neutral-400`). Specific YouTube-themed neutrals like `yt-dark-main` are also available.
    *   **Semantic Naming for Shadcn CSS Variables:** Tailwind CSS is configured to support Shadcn UI's CSS variables (e.g., `bg-background`, `text-foreground`, `border-border`). Prefer these semantic names when working with Shadcn components or general layout theming, as they adapt to the current theme (light/dark). These are defined in [`tailwind.config.js`](tailwind.config.js:69) (e.g., `backgroundColor.background` maps to `hsl(var(--background))`).

*   **Custom Utilities & `@apply`:**
    *   **Do:** Favor direct utility class application in HTML/JSX for clarity and co-location of styles.
        ```html
        <button class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600">Click Me</button>
        ```
    *   **Consider (with caution):** Use `@apply` within CSS files (e.g., [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css:0)) for complex, reusable component-like styles that are not easily encapsulated by JavaScript components, or for abstracting very common patterns. However, overuse of `@apply` can reduce the benefits of utility-first CSS.
        ```css
        /* In globals.css or component-specific CSS */
        .custom-button-style {
            @apply bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600;
        }
        ```
    *   **Don't:** Create overly broad or generic custom utility classes that replicate existing Tailwind utilities or significantly deviate from the utility-first paradigm without strong justification.

*   **Responsive Design:**
    *   **Do:** Use Tailwind's responsive prefixes (e.g., `sm:`, `md:`, `lg:`) for creating adaptive layouts.
        ```html
        <div class="w-full md:w-1/2 lg:w-1/3">Content</div>
        ```

*   **Plugins:**
    *   The `tailwindcss-animate` plugin is included (as seen in [`tailwind.config.js`](tailwind.config.js:113)) and primarily used by Shadcn UI for animations like accordions. Be aware of its presence when working with animated components.

### Guideline 2: Shadcn UI Usage

*   **Description:** Conventions for importing, using, and customizing Shadcn UI components.
*   **Rationale:** Ensures consistent integration and leverage of Shadcn UI's capabilities.

*   **Import Strategy:**
    *   **Do:** Always import Shadcn UI components using the defined path alias `@{/frontend}/components/ui/...`. This alias is configured in [`components.json`](components.json:13) and [`tsconfig.json`](tsconfig.json).
        ```typescript jsx
        import { Button } from '@/frontend/components/ui/button';
        import { Card, CardContent }from '@/frontend/components/ui/card';
        // As seen in AppLayout.tsx and SettingsPanel.tsx
        ```
    *   **Don't:** Use relative paths like `../../components/ui/button` for importing these shared UI components.

*   **Component Customization:**
    *   **Styling:** Primarily customize Shadcn components using Tailwind utility classes passed via the `className` prop.
        ```typescript jsx
        <Button variant="destructive" size="lg" className="mt-4 w-full">Delete</Button>
        ```
    *   **Structure/Behavior:** If deeper customization is needed (beyond what props and utility classes allow), consider:
        1.  Wrapping the Shadcn component in your own custom component.
        2.  If absolutely necessary and the customization is broadly applicable, carefully consider modifying the component file directly within `src/frontend/components/ui/`. This should be a rare case and well-documented.
    *   Refer to [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css:0) for base styles and CSS variables as configured in [`components.json`](components.json:8) which underpins Shadcn UI's theming.

*   **Path Aliases for Utilities:**
    *   Use the `@/frontend/lib/utils` alias (configured in [`components.json`](components.json:14) and [`tsconfig.json`](tsconfig.json)) for accessing shared utility functions, such as the `cn()` function often used with Shadcn UI for conditional class names.

*   **RSC (React Server Components):**
    *   Shadcn UI is configured with `rsc: false` in [`components.json`](components.json:4), meaning components are set up for client-side rendering by default.

### Guideline 3: General Styling Practices

*   **File Organization:**
    *   Global styles and Tailwind base/component/utility layers are primarily managed in [`src/frontend/styles/globals.css`](src/frontend/styles/globals.css:0).
    *   Component-specific styles, if minimal and not reusable, can be co-located with the component using Tailwind classes directly in JSX.
    *   For more complex, component-specific styles that cannot be achieved with utilities alone, consider CSS Modules or styled-components if the need arises and is agreed upon by the team. (Currently, the project leans heavily on utility classes).

*   **Clarity and Readability:**
    *   Aim for readable JSX/HTML. If a long list of utility classes makes a component hard to read, consider breaking the component into smaller pieces or (judiciously) using `@apply` for a small set of highly repeated class combinations.

## Enforcement / Compliance (Optional) 👮

*   Code reviews should check for adherence to these styling conventions.
*   Linters (ESLint with Tailwind plugin) can help enforce some aspects.

## Exceptions (Optional) 🤷

*   Deviations may be acceptable if a specific technical challenge cannot be reasonably solved within these guidelines.
*   Exceptions must be discussed with the frontend lead and documented (e.g., in a comment near the code or in the relevant task/ADR).

## Revision History (Optional) ⏳

*   **v1.0 (2025-06-13):** Initial draft based on recent Tailwind CSS and Shadcn UI integration.