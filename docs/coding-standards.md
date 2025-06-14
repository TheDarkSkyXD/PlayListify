## Coding Standards

* **Style Guide & Linter:** The project will use **ESLint** and **Prettier** to enforce a consistent code style. The configurations in `eslint.config.js` and `.prettierrc` are the single source of truth for styling rules and must be adhered to.
* **Naming Conventions:**
    * Variables & Functions: `camelCase`
    * Classes, Types, Interfaces, React Components: `PascalCase`
    * Constants: `UPPER_SNAKE_CASE`
    * Files: `PascalCase.tsx` for React components; `kebab-case.ts` for services, repositories, and other modules.
* **File Structure:** All new files must be placed in the appropriate directory as defined in the **Project Structure** section.
* **Unit Test File Organization:** Unit test files must be named `*.test.ts` or `*.spec.ts` and co-located with the source file they are testing.
* **Asynchronous Operations:** `async/await` must be used for all promise-based asynchronous operations. Direct use of `.then()`/`.catch()` should be limited to cases where `async/await` is not feasible.
* **Type Safety:**
    * TypeScript's `strict` mode must be enabled in `tsconfig.json`.
    * The use of the `any` type is strongly discouraged and requires explicit justification in a code comment.
* **Comments & Documentation:**
    * Comments should explain the *why* behind complex or non-obvious code, not the *what*.
    * TSDoc format must be used for documenting all exported functions, classes, and types.
* **Dependency Management:**
    * Dependencies are managed via `package.json`.
    * Adding new third-party dependencies requires a brief review to assess their necessity, maintenance status, and security posture.
* **Detailed Language Conventions (TypeScript/Node.js):**
    * **Modules:** ESModules (`import`/`export`) must be used exclusively.
    * **Null Handling:** `strictNullChecks` must be enabled. Use optional chaining (`?.`) and nullish coalescing (`??`) to safely handle `null` and `undefined` values.
    * **Immutability:** Prefer immutable data structures. Avoid direct mutation of state objects and props.