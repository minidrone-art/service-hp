/**
 * Registers the `@testing-library/jest-dom` matcher types with Vitest's
 * `Assertion` interface for the whole frontend TypeScript project.
 *
 * `vitest.setup.ts` imports the runtime matchers, but it lives outside the
 * `include: ["src"]` root, so its import does not reach the type-checker. This
 * declaration file sits inside `src/` and pulls in the same module augmentation,
 * which is what makes `expect(...).toBeInTheDocument()` type-check.
 */
import "@testing-library/jest-dom/vitest";
