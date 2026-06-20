import type { Mission } from "@terminal-invaders/core";

export const deepChain: Mission = {
  id: "nav-007",
  title: "Deep Chain",
  difficulty: 3,
  track: "navigation",
  briefing:
    "The config you need is buried deep. Walk the whole chain in one move (`cd src/features/auth/config`), then open settings.ts. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/features": { type: "dir" },
    "/project/src/features/auth": { type: "dir" },
    "/project/src/features/auth/config": { type: "dir" },
    "/project/src/features/auth/config/settings.ts": {
      type: "file",
      content: "export const settings = {\n  provider: 'oauth',\n  ttl: 3600,\n};",
    },
    "/project/src/features/auth/login.ts": { type: "file", content: "export const login = () => {};" },
    "/project/src/features/billing": { type: "dir" },
    "/project/src/features/billing/index.ts": { type: "file", content: "export const billing = {};" },
  },
  objectives: [
    { id: "into-config", label: "Walk to the config dir (cd src/features/auth/config)", type: "cwd_is", path: "/project/src/features/auth/config" },
    { id: "open-settings", label: "Open settings.ts", type: "file_opened", path: "/project/src/features/auth/config/settings.ts" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "You can chain folders in one cd: `cd a/b/c`." },
    { text: "Try `cd src/features/auth/config`, then `cat settings.ts` or `open settings.ts`." },
  ],
  successMessage: "One cd can cover the whole path — no need to step through each level.",
};
