import type { Mission } from "@terminal-invaders/core";

export const trackDownTheBug: Mission = {
  id: "search-010",
  title: "Track Down the Bug (boss)",
  difficulty: 3,
  track: "search",
  briefing:
    'Production logs show the error "Invalid session token". First search that exact string to find where it is thrown (validateSession). Then search "validateSession" to find the route that calls it. Open both files, then check.',
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/src": { type: "dir" },
    "/project/src/auth": { type: "dir" },
    "/project/src/auth/session.ts": {
      type: "file",
      content:
        "export function validateSession(token) {\n  if (!token) throw new Error('Invalid session token');\n  return decode(token);\n}",
    },
    "/project/src/routes": { type: "dir" },
    "/project/src/routes/dashboard.ts": {
      type: "file",
      content:
        "import { validateSession } from '../auth/session';\nexport function dashboard(req) {\n  const user = validateSession(req.token);\n  return render(user);\n}",
    },
    "/project/src/routes/public.ts": {
      type: "file",
      content: "export function landing() {\n  return render('home');\n}",
    },
  },
  objectives: [
    {
      id: "search-error",
      label: 'Search for the error string "Invalid session token"',
      type: "search_performed",
      query: "Invalid session token",
      expectedPath: "/project/src/auth/session.ts",
    },
    {
      id: "open-thrower",
      label: "Open the file that throws the error",
      type: "file_opened",
      path: "/project/src/auth/session.ts",
    },
    {
      id: "search-callsite",
      label: 'Search for "validateSession" to find the call site',
      type: "search_performed",
      query: "validateSession",
      expectedPath: "/project/src/routes/dashboard.ts",
    },
    {
      id: "open-callsite",
      label: "Open the route that calls validateSession",
      type: "file_opened",
      path: "/project/src/routes/dashboard.ts",
    },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: 'Search the literal log text first: rg "Invalid session token".' },
    { text: "That points at validateSession — now search its name to find callers." },
    { text: 'rg "validateSession" finds src/routes/dashboard.ts; open both files.' },
  ],
  successMessage: "Error string to thrower to caller — you traced the bug end to end.",
};
