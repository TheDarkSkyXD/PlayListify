# ADR-001: Backend Layered Architecture

**Date:** 2025-07-04

**Status:** Accepted

## Context

The backend (Main Process) of the Playlistify application is responsible for core business logic, data persistence, and interaction with external tools and services. A clear and maintainable structure is required to manage this complexity, facilitate testing, and allow for future scalability.

## Decision

We will adopt a **Layered Architecture** for the backend, organizing the code into three distinct layers:

1.  **IPC Layer:** The top-most layer, serving as the entry point for all requests from the frontend. Its sole responsibility is to handle Inter-Process Communication (IPC), validate incoming data payloads against the typed contract, and delegate the request to the appropriate service in the layer below. It does not contain any business logic.
2.  **Service Layer:** This is the core of the backend, containing all business logic. Services like `PlaylistService` and `DownloadService` orchestrate complex operations, coordinating calls to various repositories and other services.
3.  **Repository Layer (Data Access Layer):** The bottom-most layer, responsible for all interactions with the database. It abstracts all SQL queries and data mapping logic, providing a clean, object-oriented API to the Service Layer.

## Rationale

-   **Separation of Concerns:** This pattern enforces a strong separation of concerns. The UI is decoupled from the business logic, which is decoupled from the data access logic. This makes the system easier to understand, maintain, and modify.
-   **Testability:** Each layer can be tested independently. The IPC Layer can be tested by mocking the Service Layer. The Service Layer can be unit-tested by mocking the Repository Layer, allowing for tests that run without a real database. The Repository Layer can be tested with an in-memory SQLite database.
-   **Maintainability:** Changes in one layer have minimal impact on others. For example, changing the database from SQLite to something else would only require changes in the Repository Layer, leaving the Service Layer untouched. Similarly, changing an IPC channel name only affects the IPC Layer.
-   **Clarity:** The unidirectional flow of dependencies (IPC -> Service -> Repository) makes the data flow and control flow of the application predictable and easy to follow.

## Consequences

-   **Increased Boilerplate:** Introducing distinct layers may lead to a slightly higher amount of initial boilerplate code compared to a monolithic approach.
-   **Strict Discipline:** Developers must adhere to the layered structure and avoid creating "leaky" abstractions where a higher layer bypasses the one below it (e.g., the IPC layer directly calling a repository).