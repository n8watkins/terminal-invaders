import type { Mission } from "@terminal-invaders/core";

export const theRightMatch: Mission = {
  id: "search-003",
  title: "The Right Match",
  difficulty: 2,
  track: "search",
  briefing:
    'You need the route named exactly "/checkout". Other files mention "/checkout-legacy" and "/checkouts" — ignore those. Search for the exact term, open the right file, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/routes": { type: "dir" },
    "/project/src/routes/checkout.ts": {
      type: "file",
      content: 'export const route = "/checkout";\nexport function handler() {}',
    },
    "/project/src/routes/legacy.ts": {
      type: "file",
      content: 'export const route = "/checkout-legacy";',
    },
    "/project/src/routes/list.ts": {
      type: "file",
      content: 'export const route = "/checkouts";',
    },
  },
  objectives: [
    {
      id: "search-exact",
      label: 'Search for the exact route "/checkout"',
      type: "search_performed",
      query: '"/checkout"',
      expectedPath: "/project/src/routes/checkout.ts",
    },
    {
      id: "open-target",
      label: "Open the file with the exact route",
      type: "file_opened",
      path: "/project/src/routes/checkout.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "The decoys say /checkout-legacy and /checkouts — search the full quoted term." },
    { text: `rg '"/checkout"' narrows to the exact match (include the surrounding quotes).` },
    { text: "Open the file rg points at: src/routes/checkout.ts." },
  ],
  successMessage: "Precise queries beat noisy ones — you matched the exact term.",
};
