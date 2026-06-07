import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@terminal-invaders/core": r("./packages/core/src/index.ts"),
      "@terminal-invaders/missions": r("./packages/missions/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/test/**/*.test.ts"],
  },
});
