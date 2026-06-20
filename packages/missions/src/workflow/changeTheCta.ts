import type { Mission } from "@terminal-invaders/core";

export const changeTheCta: Mission = {
  id: "workflow-004",
  title: "Change the CTA",
  difficulty: 2,
  track: "workflow",
  briefing:
    'The call-to-action still says "Start now". Find it with rg, open the file in nvim, substitute it to "Get started" with :%s, save, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/app": { type: "dir" },
    "/project/src/app/page.tsx": {
      type: "file",
      content:
        'export default function Page() {\n  return (\n    <main>\n      <button>Start now</button>\n    </main>\n  );\n}',
    },
  },
  objectives: [
    {
      id: "search-cta",
      label: 'Search for "Start now"',
      type: "search_performed",
      query: "Start now",
      expectedPath: "/project/src/app/page.tsx",
    },
    { id: "open-page", label: "Open page.tsx in nvim", type: "file_opened", path: "/project/src/app/page.tsx" },
    { id: "substitute", label: "Use a substitute command (:%s)", type: "editor_command_used", command: ":%s" },
    { id: "new-copy", label: 'File now contains "Get started"', type: "file_contains", path: "/project/src/app/page.tsx", text: "Get started" },
    { id: "old-gone", label: 'File no longer contains "Start now"', type: "file_lacks", path: "/project/src/app/page.tsx", text: "Start now" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'Locate the copy: rg "Start now"' },
    { text: "Open it: nvim src/app/page.tsx" },
    { text: "Swap it everywhere and save: :%s/Start now/Get started/g then :wq" },
  ],
  successMessage: "Search, open, substitute, save — copy changes are a one-liner.",
};
