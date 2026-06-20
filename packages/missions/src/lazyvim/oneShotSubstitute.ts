import type { Mission } from "@terminal-invaders/core";

export const oneShotSubstitute: Mission = {
  id: "lv-008",
  title: "One-Shot Substitute",
  difficulty: 3,
  track: "lazyvim",
  briefing:
    'The variable `count` was renamed to `total` everywhere. Open counter.ts, run :%s/count/total/g to swap every occurrence, save, and check.',
  startingCwd: "/project/src",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/counter.ts": {
      type: "file",
      content:
        "let count = 0;\n\nexport function bump() {\n  count = count + 1;\n  return count;\n}",
    },
  },
  objectives: [
    { id: "substitute", label: "Use a substitute command (:%s)", type: "editor_command_used", command: ":%s" },
    {
      id: "added",
      label: 'File now contains "total"',
      type: "file_contains",
      path: "/project/src/counter.ts",
      text: "total",
    },
    {
      id: "removed",
      label: 'File no longer contains "count"',
      type: "file_lacks",
      path: "/project/src/counter.ts",
      text: "count",
    },
    { id: "saved", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim counter.ts" },
    { text: "Substitute across the whole file: :%s/count/total/g" },
    { text: "The trailing g replaces every match on each line. Then :wq." },
  ],
  successMessage: "One :%s rename touches every line — no manual hunting.",
};
