import type { Mission } from "@terminal-invaders/core";

export const inspectRoot: Mission = {
  id: "nav-001",
  title: "Where Am I?",
  difficulty: 1,
  track: "navigation",
  briefing:
    "You just landed in a project. Get your bearings: print where you are, list what's here, then run check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/tests": { type: "dir" },
    "/project/package.json": { type: "file", content: '{ "name": "demo" }' },
    "/project/README.md": { type: "file", content: "# Demo" },
  },
  objectives: [
    { id: "pwd", label: "Print the current directory (pwd)", type: "command_used", command: "pwd" },
    { id: "ls", label: "List the contents (ls)", type: "command_used", command: "ls" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`pwd` prints your current path." },
    { text: "`ls` lists what's in the current directory." },
  ],
  successMessage: "Nice — you can always orient with pwd + ls.",
};
