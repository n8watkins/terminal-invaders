import type { Journey } from "@terminal-invaders/core";

/**
 * "Fuzzy Finder" — a shared-world journey that teaches the fzf mindset.
 *
 * One mid-sized codebase carries across three steps. You never `cd` your way
 * around it; instead you fuzzy-narrow the whole file list to the one path you
 * want and open it in a keystroke. The point lands harder because the tree is
 * big enough that hand-navigating would be tedious: `fzf <query>` types a few
 * distinctive characters of a basename and jumps straight there.
 *
 * The mental model the steps drill:
 *   - fzf is "pick one thing from a big list" — feed it any list, type to narrow.
 *   - The pipe pattern is the real power: `rg --files | fzf` to open a file,
 *     `git branch | fzf` to pick a branch, `Ctrl-R` to fuzzy-search history.
 *   - Matching is *subsequence* fuzzy and favors the basename, so you type the
 *     distinctive consonants (`pgtsx` finds `page.tsx`) rather than the full name.
 *   - Editor integrations (fzf.vim, Telescope) are the same idea wired into nvim.
 *
 * In this trainer fzf is non-interactive: `fzf` alone shows the candidate list
 * (like staring at the picker), and `fzf <query>` selects + opens the single
 * best match.
 */

const BUTTON_TSX = `export function Button({ label }: { label: string }) {
  return <button className="btn">{label}</button>;
}
`;

const PAGE_TSX = `import { Button } from "../components/Button";

export default function Page() {
  return <Button label="Get started" />;
}
`;

const UTILS_TS = `export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export const noop = () => {};
`;

const BUTTON_TEST = `import { Button } from "../src/components/Button";

test("renders its label", () => {
  expect(Button({ label: "Hi" })).toBeTruthy();
});
`;

const GUIDE_MD = `# Contributor guide

Run \`npm install\`, then \`npm run dev\` to start the playground.
`;

const README_MD = `# Acme Web

A tiny React app used to practice navigating a real-ish codebase with fzf.
`;

const PACKAGE_JSON = `{
  "name": "acme-web",
  "version": "1.0.0",
  "scripts": { "dev": "vite", "test": "vitest" }
}
`;

const HANDLER_TS = `export function handler() {
  return 200;
}
`;

export const fzfJourney: Journey = {
  id: "journey-fzf",
  title: "Fuzzy Finder: never cd again",
  environment: "tool:fzf",
  blurb:
    "One real-ish codebase, three steps. Stop hand-navigating directories — fuzzy-narrow the whole file list to the one path you want and open it in a keystroke. Type a few distinctive characters; fzf does the rest.",
  outcomes: [
    "Open the fzf picker and fuzzy-select a file by typing a few characters of its name",
    "Jump to a deeply nested file without a single cd, straight from the file list",
    "Find a brand-new teammate file instantly — no idea where it lives required",
  ],
  world: {
    startingCwd: "/code",
    filesystem: {
      "/code": { type: "dir" },
      "/code/src": { type: "dir" },
      "/code/src/components": { type: "dir" },
      "/code/src/components/Button.tsx": { type: "file", content: BUTTON_TSX },
      "/code/src/app": { type: "dir" },
      "/code/src/app/page.tsx": { type: "file", content: PAGE_TSX },
      "/code/src/lib": { type: "dir" },
      "/code/src/lib/utils.ts": { type: "file", content: UTILS_TS },
      "/code/src/api": { type: "dir" },
      "/code/tests": { type: "dir" },
      "/code/tests/button.test.ts": { type: "file", content: BUTTON_TEST },
      "/code/docs": { type: "dir" },
      "/code/docs/guide.md": { type: "file", content: GUIDE_MD },
      "/code/README.md": { type: "file", content: README_MD },
      "/code/package.json": { type: "file", content: PACKAGE_JSON },
    },
  },
  steps: [
    {
      id: "open-picker",
      title: "Step 1 — Open the picker, then pick",
      briefing:
        "fzf is the universal \"pick one thing from a big list\" tool. Run `fzf` with no query first — that's like opening the picker and staring at every file path at once. Then narrow it: `fzf <query>` fuzzy-matches your characters against the whole list and opens the single best match. Find `src/lib/utils.ts` by typing just `utils` — the contiguous run inside the basename wins instantly. (In a real shell the canonical pattern is `rg --files | fzf`: pipe the file list into fzf and type to narrow.)",
      concepts: ["fzf"],
      objectives: [
        { id: "use-fzf", label: "Run fzf (open the picker)", type: "command_used", command: "fzf" },
        { id: "open-utils", label: "Fuzzy-open src/lib/utils.ts", type: "file_opened", path: "/code/src/lib/utils.ts" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "Run bare `fzf` to see the candidate list — every file path in the project." },
        { text: "Now narrow it: `fzf utils`. \"utils\" is a contiguous match inside `utils.ts`, so it's the unique winner." },
        { text: "fzf opened it for you. Run `check`." },
      ],
      successMessage: "That's the loop: see the list, type a few characters, open the one match. No cd required.",
    },
    {
      id: "deep-find",
      title: "Step 2 — Reach deep without a single cd",
      briefing:
        "The page component lives at `src/app/page.tsx`, three directories down. Navigating there by hand is `cd src`, `cd app`, then open — three moves. fzf collapses it to one. The matcher is *subsequence* fuzzy and weights the basename, so you type the distinctive characters of the filename, not the path: `pgtsx` is enough to single out `page.tsx`. (This is exactly what fzf.vim and Telescope wire into your editor — a fuzzy file list you narrow to one result, then Enter to open.)",
      concepts: ["fzf"],
      objectives: [
        { id: "open-page", label: "Fuzzy-open src/app/page.tsx", type: "file_opened", path: "/code/src/app/page.tsx" },
        { id: "use-fzf", label: "Use fzf to get there", type: "command_used", command: "fzf" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "Don't cd. Stay where you are and let fzf reach across the whole tree." },
        { text: "Type the distinctive consonants of the basename: `fzf pgtsx` lands on `page.tsx`." },
        { text: "Opened straight from the file list — run `check`." },
      ],
      successMessage: "One keystroke beat three cd's. The deeper the tree, the more fzf wins.",
    },
    {
      id: "find-new",
      title: "Step 3 — Find a file you've never seen",
      briefing:
        "A teammate just pushed `src/api/handler.ts` — a file you didn't write and can't picture in the tree. That's fzf's sweet spot: you don't need to know where something lives, only roughly what it's called. Type `handler` and fzf surfaces it from anywhere in the list. (The same trick generalizes far past files: `git branch | fzf`, `kill -9 $(ps aux | fzf | awk '{print $2}')`, and `Ctrl-R` fuzzy-searching your shell history are all the identical narrow-a-list move.)",
      concepts: ["fzf"],
      setup: {
        writeFiles: {
          "/code/src/api/handler.ts": HANDLER_TS,
        },
      },
      objectives: [
        { id: "open-handler", label: "Fuzzy-open the new src/api/handler.ts", type: "file_opened", path: "/code/src/api/handler.ts" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "You don't need to know the directory. Just describe the name: `fzf handler`." },
        { text: "fzf found the brand-new file and opened it — run `check`." },
      ],
      successMessage: "You opened a file you'd never seen, without knowing its path. That's the whole pitch for fuzzy finding.",
    },
  ],
};
