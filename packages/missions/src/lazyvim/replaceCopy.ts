import type { Mission } from "@terminal-invaders/core";

export const replaceCopy: Mission = {
  id: "lv-010",
  title: "Replace the Copy (boss)",
  difficulty: 3,
  track: "lazyvim",
  briefing:
    'Marketing changed the CTA: "Start now" should become "Get started". Open the page, use a substitute (:%s/Start now/Get started/g) to swap it everywhere, save, and check.',
  startingCwd: "/project/src/app",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/app": { type: "dir" },
    "/project/src/app/page.tsx": {
      type: "file",
      content:
        "export default function Page() {\n  return (\n    <main>\n      <button>Start now</button>\n      <a href=\"/signup\">Start now</a>\n    </main>\n  );\n}",
    },
  },
  objectives: [
    { id: "substitute", label: "Use a substitute command (:%s)", type: "editor_command_used", command: ":%s" },
    { id: "added", label: 'File now contains "Get started"', type: "file_contains", path: "/project/src/app/page.tsx", text: "Get started" },
    { id: "removed", label: 'File no longer contains "Start now"', type: "file_lacks", path: "/project/src/app/page.tsx", text: "Start now" },
    { id: "saved", label: "Save the file (:w or :wq)", type: "editor_command_used", command: ":w" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Open it: nvim page.tsx" },
    { text: "Substitute across the whole file: :%s/Start now/Get started/g" },
    { text: "The trailing g replaces every match on each line. Then :wq." },
  ],
  successMessage: "Global substitute — that's how you rename copy in one shot.",
};
