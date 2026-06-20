import type { Mission } from "@terminal-invaders/core";

export const findByConvention: Mission = {
  id: "nav-009",
  title: "Find by Convention",
  difficulty: 3,
  track: "navigation",
  briefing:
    "Tooling configs live at the project root by convention. You don't need to search — go to the root and open tsconfig.json. Then check.",
  startingCwd: "/project/src/components",
  filesystem: {
    "/project": { type: "dir" },
    "/project/tsconfig.json": {
      type: "file",
      content: '{\n  "compilerOptions": {\n    "strict": true\n  }\n}',
    },
    "/project/package.json": { type: "file", content: '{ "name": "app" }' },
    "/project/.eslintrc.json": { type: "file", content: '{ "extends": "next" }' },
    "/project/src": { type: "dir" },
    "/project/src/components": { type: "dir" },
    "/project/src/components/Card.tsx": { type: "file", content: "export const Card = () => null;" },
    "/project/src/index.ts": { type: "file", content: "export {};" },
  },
  objectives: [
    { id: "to-root", label: "Go to the project root (cd /project)", type: "cwd_is", path: "/project" },
    { id: "open-tsconfig", label: "Open tsconfig.json", type: "file_opened", path: "/project/tsconfig.json" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Config files like tsconfig.json sit at the project root, not next to components." },
    { text: "`cd /project` (or `cd ../..`) gets you to the root, then `open tsconfig.json`." },
  ],
  successMessage: "Know the convention, skip the search — root-level configs are predictable.",
};
