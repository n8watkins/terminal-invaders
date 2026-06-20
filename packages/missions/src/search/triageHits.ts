import type { Mission } from "@terminal-invaders/core";

export const triageHits: Mission = {
  id: "search-008",
  title: "Triage Hits",
  difficulty: 3,
  track: "search",
  briefing:
    'Three files call "sendEmail", but only the one in the signup flow throws on a null address. Search for "sendEmail", triage the hits, open src/signup.ts, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/newsletter.ts": {
      type: "file",
      content: "export function blast() {\n  sendEmail(list, 'news');\n}",
    },
    "/project/src/signup.ts": {
      type: "file",
      content:
        "export function register(addr) {\n  // throws when addr is null\n  sendEmail(addr, 'welcome');\n}",
    },
    "/project/src/receipt.ts": {
      type: "file",
      content: "export function receipt(order) {\n  sendEmail(order.email, 'receipt');\n}",
    },
  },
  objectives: [
    {
      id: "search-hits",
      label: 'Search for "sendEmail"',
      type: "search_performed",
      query: "sendEmail",
      expectedPath: "/project/src/signup.ts",
    },
    {
      id: "open-culprit",
      label: "Open the signup flow (the culprit)",
      type: "file_opened",
      path: "/project/src/signup.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'rg "sendEmail" lists all three call sites.' },
    { text: "The briefing says the signup flow is the culprit — open src/signup.ts." },
    { text: "Open it: nvim src/signup.ts." },
  ],
  successMessage: "Many hits, one culprit — read the matches and pick the right one.",
};
