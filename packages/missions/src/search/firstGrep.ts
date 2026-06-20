import type { Mission } from "@terminal-invaders/core";

export const firstGrep: Mission = {
  id: "search-001",
  title: "First Grep",
  difficulty: 1,
  track: "search",
  briefing:
    'A magic word, "fizzbuzz", lives in exactly one file. Use rg to find which file, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/index.ts": { type: "file", content: "export * from './math';" },
    "/project/src/math.ts": {
      type: "file",
      content: "export function classify(n) {\n  // fizzbuzz handling lives here\n  return n;\n}",
    },
    "/project/src/util.ts": { type: "file", content: "export const noop = () => {};" },
  },
  objectives: [
    {
      id: "search-needle",
      label: 'Search for "fizzbuzz"',
      type: "search_performed",
      query: "fizzbuzz",
      expectedPath: "/project/src/math.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'rg searches inside files: rg "fizzbuzz".' },
    { text: "The output line is path:line — that path holds the needle." },
  ],
  successMessage: "One command, one match — rg found the needle instantly.",
};
