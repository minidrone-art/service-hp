import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the frontend component/integration suite.
 *
 * The DOM environment is set here (and mirrored in the `test` script) so the
 * suite runs identically whether it is invoked through the package script or
 * directly. The `@` alias mirrors `vite.config.js` so tests import production
 * modules by the same specifier the app does.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@icp-sdk/core"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    // The build container exports thread-count env vars that conflict with
    // Vitest's own defaults ("minThreads and maxThreads must not conflict").
    // Pinning both here makes the suite runnable regardless of the ambient
    // environment.
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1,
      },
    },
  },
});
