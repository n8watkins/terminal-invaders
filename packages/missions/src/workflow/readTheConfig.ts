import type { Mission } from "@terminal-invaders/core";

export const readTheConfig: Mission = {
  id: "workflow-002",
  title: "Read the Config",
  difficulty: 1,
  track: "workflow",
  briefing:
    "The build settings live in a config file under config/. Navigate into config/, open settings.ts to read it, then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/package.json": {
      type: "file",
      content: '{\n  "name": "acme-web",\n  "scripts": { "dev": "next dev" }\n}',
    },
    "/project/config": { type: "dir" },
    "/project/config/settings.ts": {
      type: "file",
      content:
        "export const settings = {\n  port: 3000,\n  env: 'development',\n  retries: 3,\n};",
    },
    "/project/config/secrets.ts": {
      type: "file",
      content: "export const secrets = {\n  token: 'redacted',\n};",
    },
  },
  objectives: [
    { id: "enter-config", label: "Enter the config directory", type: "cwd_is", path: "/project/config" },
    { id: "open-settings", label: "Open settings.ts", type: "file_opened", path: "/project/config/settings.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "Move into the folder: cd config" },
    { text: "Open the file to read it: nvim settings.ts (or cat settings.ts)" },
  ],
  successMessage: "Navigate, then open — that's how you read any file in a project.",
};
