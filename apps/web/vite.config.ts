import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Resolve the workspace packages straight to their TS source so Vite transpiles
// them with HMR — no build step for core/missions.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@terminal-invaders/core": r("../../packages/core/src/index.ts"),
      "@terminal-invaders/missions": r("../../packages/missions/src/index.ts"),
    },
  },
});
