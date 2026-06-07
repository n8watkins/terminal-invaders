import type { Mission } from "@terminal-invaders/core";

export const heroCopy: Mission = {
  id: "hero-copy-001",
  title: "Find the Hero Copy",
  difficulty: 1,
  track: "workflow",
  briefing:
    'The homepage button says "Start now". Find the file, search for the copy, open it in nvim, then run check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/package.json": {
      type: "file",
      content: '{\n  "name": "acme-web",\n  "scripts": { "dev": "next dev" }\n}',
    },
    "/project/README.md": { type: "file", content: "# Acme Web\n\nThe marketing site." },
    "/project/src": { type: "dir" },
    "/project/src/lib": { type: "dir" },
    "/project/src/lib/utils.ts": { type: "file", content: "export const cn = () => {};" },
    "/project/src/components": { type: "dir" },
    "/project/src/components/Button.tsx": {
      type: "file",
      content: "export function Button(props) {\n  return <button {...props} />;\n}",
    },
    "/project/src/app": { type: "dir" },
    "/project/src/app/layout.tsx": {
      type: "file",
      content: "export default function Layout({ children }) {\n  return <html>{children}</html>;\n}",
    },
    "/project/src/app/page.tsx": {
      type: "file",
      metadata: { target: true, editable: true },
      content:
        'export default function Page() {\n  return (\n    <main>\n      <h1>Welcome to Acme</h1>\n      <button>Start now</button>\n    </main>\n  );\n}',
    },
  },
  objectives: [
    { id: "inspect-root", label: "Inspect the project root (ls)", type: "command_used", command: "ls" },
    { id: "enter-src", label: "Enter src", type: "cwd_is", path: "/project/src" },
    { id: "enter-app", label: "Enter app", type: "cwd_is", path: "/project/src/app" },
    {
      id: "search-copy",
      label: 'Search for "Start now"',
      type: "search_performed",
      query: "Start now",
      expectedPath: "/project/src/app/page.tsx",
    },
    {
      id: "open-page",
      label: "Open page.tsx in nvim",
      type: "file_opened",
      path: "/project/src/app/page.tsx",
    },
    { id: "open-nvim", label: "Use nvim", type: "command_used", command: "nvim" },
    { id: "run-check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "App Router pages usually live under src/app." },
    { text: 'Use rg to search text across files: rg "Start now"' },
    { text: "Open the matched file: nvim src/app/page.tsx" },
  ],
  successMessage: "Mission complete — you found and opened the hero copy.",
};
