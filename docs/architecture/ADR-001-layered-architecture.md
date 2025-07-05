# ADR-001: Adoption of a Layered (N-Tier) Architecture for the Backend

*   **Status:** Accepted
*   **Date:** 2025-07-05
*   **Deciders:** Playlistify Development Team

## Context and Problem Statement

We need to choose a primary architectural pattern for the Playlistify backend (the Electron main process). The chosen architecture must support our key non-functional requirements: high testability, maintainability, and a clear separation of concerns. The backend is responsible for business logic, data persistence, and communication with external services, and its complexity requires a structured approach to prevent it from becoming a monolithic, tangled "big ball of mud."

## Decision Drivers

*   **Testability:** Each part of the system should be testable in isolation. Business logic should not be coupled to the database or external APIs.
*   **Maintainability:** The codebase should be easy to understand, navigate, and modify. Changes in one area (e.g., the database schema) should have minimal ripple effects on other areas (e.g., the business logic).
*   **Separation of Concerns:** Different responsibilities (e.g., handling UI requests, executing business rules, accessing data, wrapping external tools) should be handled by distinct, specialized components.
*   **Scalability:** The architecture should be able to accommodate new features and increasing complexity without requiring a major redesign.

## Considered Options

1.  **Layered (N-Tier) Architecture:** A classic pattern that organizes code into horizontal layers: Services, Repositories, and Adapters. Dependencies flow in one direction (top-down).
2.  **Monolithic Architecture (No specific pattern):** Placing all logic into a few large service files. This is simpler initially but quickly becomes difficult to manage.
3.  **Microservices Architecture:** Breaking the backend into separate, independently deployable services. This is overly complex for a desktop application and introduces significant overhead.

## Decision Outcome

**Chosen Option:** **Layered (N-Tier) Architecture.**

We will implement a three-layered architecture for the backend:

1.  **Services Layer (`src/backend/services/`):**
    *   **Responsibility:** Contains the core business logic and orchestrates application workflows.
    *   **Example:** `PlaylistManager` will coordinate fetching metadata from the `YoutubeService` and saving it via the `PlaylistRepository`.
    *   **Dependencies:** Can only depend on other services and repositories. **Cannot** access adapters or the database directly.

2.  **Repositories Layer (`src/backend/repositories/`):**
    *   **Responsibility:** Implements the Repository pattern, providing a clean, object-oriented interface for data access. It abstracts the underlying data source.
    *   **Example:** `PlaylistRepository` will have methods like `getById(id)` and `create(playlist)`, hiding the SQL queries needed to interact with the database.
    *   **Dependencies:** Can only depend on the Adapters layer (specifically, the `SQLiteAdapter`).

3.  **Adapters Layer (`src/backend/adapters/`):**
    *   **Responsibility:** Wraps and isolates all external dependencies, such as database drivers (`better-sqlite3`) or command-line tools (`yt-dlp-wrap`).
    *   **Example:** `SQLiteAdapter` manages the database connection and executes queries. `YtdlpWrapAdapter` wraps the `yt-dlp-wrap` library.
    *   **Dependencies:** Has no dependencies on other layers within our application.

### Positive Consequences

*   **Excellent Separation of Concerns:** Each layer has a single, well-defined responsibility, making the system easier to reason about.
*   **High Testability:**
    *   Services can be unit tested by mocking the repository layer, allowing us to test business logic without a real database.
    *   Repositories can be integration tested against a real (or in-memory) database without needing to involve the service layer.
    *   Adapters can be tested in isolation to ensure they correctly interact with the external tools.
*   **Improved Maintainability:** Since dependencies only flow downwards, we can replace an entire layer with a different implementation with minimal impact on the layers above it. For example, we could swap SQLite for another database by simply writing a new set of repositories and a new database adapter, with no changes required to the Service layer.
*   **Clear Structure:** The folder structure directly reflects the architecture, making it easy for developers to find code and understand its role.

### Negative Consequences (Trade-offs)

*   **Increased Indirection:** For very simple operations, the flow (`Service -> Repository -> Adapter`) can feel verbose and add boilerplate code compared to a monolithic approach. However, this initial overhead pays significant dividends as the application's complexity grows.
*   **Strict Discipline Required:** The team must be disciplined about respecting layer boundaries. A developer taking a "shortcut" and calling an adapter directly from a service would violate the pattern and begin to erode its benefits. This will be enforced through code reviews and potentially linting rules.