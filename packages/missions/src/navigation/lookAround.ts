import type { Mission } from "@terminal-invaders/core";

export const lookAround: Mission = {
  id: "nav-002",
  title: "Look Around",
  difficulty: 1,
  track: "navigation",
  briefing:
    "Survey a fresh checkout. List the root with `ls`, peek inside src with `ls src`, then `cat README.md` to read the landmark. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/index.ts": { type: "file", content: "export const main = () => {};" },
    "/project/src/utils.ts": { type: "file", content: "export const noop = () => {};" },
    "/project/docs": { type: "dir" },
    "/project/README.md": {
      type: "file",
      content: "# Acme Service\n\nA small HTTP service. Start here to learn the layout.",
    },
    "/project/package.json": { type: "file", content: '{ "name": "acme-service" }' },
  },
  objectives: [
    { id: "ls", label: "List the current directory (ls)", type: "command_used", command: "ls" },
    { id: "open-readme", label: "Read the landmark file (cat README.md)", type: "file_opened", path: "/project/README.md" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`ls` lists here; `ls src` lists a subdirectory without moving into it." },
    { text: "`cat README.md` prints the file so you can read it." },
  ],
  successMessage: "ls to see what's around, cat to read it — no need to cd to look.",
};
