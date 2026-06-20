import type { Mission } from "@terminal-invaders/core";

const COLORS_HEAD = "export const PRIMARY = '#0066ff';";
const COLORS_WORKING = "export const PRIMARY = '#ff00ff';"; // bad experiment — discard this

const COPY_HEAD = "export const HEADLINE = 'Welcome';";
const COPY_WORKING = "export const HEADLINE = 'Welcome back';"; // good edit — keep this

export const restoreJustOne: Mission = {
  id: "git-008",
  title: "Restore Just One",
  difficulty: 3,
  track: "git",
  briefing:
    "Two files are modified: colors.ts (a bad color experiment) and copy.ts (a good headline tweak). Use `git status` to see both, then `git restore colors.ts` to discard ONLY the color change — leave copy.ts untouched. Then check.",
  startingCwd: "/project",
  filesystem: {
    "/project": { type: "dir" },
    "/project/colors.ts": { type: "file", content: COLORS_WORKING },
    "/project/copy.ts": { type: "file", content: COPY_WORKING },
  },
  git: {
    head: {
      "/project/colors.ts": COLORS_HEAD,
      "/project/copy.ts": COPY_HEAD,
    },
  },
  objectives: [
    // Note: there's no "file is still dirty" objective to assert copy.ts was left
    // alone — and a file_contains on its working text would be true from the start
    // and latch immediately (an inert guard). So we verify the part that actually
    // requires targeted action — colors.ts restored — and teach "just one" via the
    // two-dirty-file setup and the briefing.
    { id: "status", label: "See both modified files (git status)", type: "git_subcommand_used", sub: "status" },
    { id: "clean", label: "Restore colors.ts to the committed version", type: "git_clean", path: "/project/colors.ts" },
    { id: "colorback", label: "Confirm the original color is back", type: "file_contains", path: "/project/colors.ts", text: "#0066ff" },
    { id: "check", label: "Run check", type: "command_used", command: "check" },
  ],
  hints: [
    { text: "`git status` lists both colors.ts and copy.ts as modified." },
    { text: "Restore only the bad one: git restore colors.ts" },
    { text: "Naming a single file means git leaves the others exactly as they are." },
  ],
  successMessage: "git restore takes a path — it only touches the file you name.",
};
