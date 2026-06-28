import { basename } from "../fs/pathUtils.ts";
import type { Lesson } from "../lessons/types.ts";
import type { CommandSpec } from "./types.ts";

/**
 * `fzf` — a non-interactive approximation of the fuzzy finder.
 *
 * The real fzf is interactive: you pipe a list in (files, branches, history),
 * type a few characters, watch it narrow, and hit Enter to pick one. Our
 * line-based engine can't do the live-typing dance, so we model the *mental
 * model* instead: `fzf <query>` fuzzy-matches the query against every FILE in
 * the virtual filesystem and "selects" the single best match — opening it so it
 * satisfies the same file-tracking as `open`/`cat`. `fzf` with no query just
 * lists the candidates, like staring at the picker before you start typing.
 */

/**
 * Subsequence fuzzy match, fzf-style. Returns a score where higher is better, or
 * `null` when `query` is NOT a subsequence of `candidate` (case-insensitive).
 * The heuristic rewards: contiguous runs (the chars sit next to each other),
 * matches inside the basename (fzf weights the filename heavily), and a match
 * right at the start of the basename. Longer paths take a tiny penalty so the
 * tightest, most specific match wins ties.
 */
export function fuzzyScore(query: string, candidate: string): number | null {
  const q = query.toLowerCase();
  const c = candidate.toLowerCase();
  if (q.length === 0) return 0;

  const base = basename(candidate).toLowerCase();
  const baseStart = c.length - base.length; // index where the filename begins

  let score = 0;
  let ci = 0; // cursor into the candidate
  let prevMatch = -2; // index of the previously matched char

  for (const ch of q) {
    let found = -1;
    while (ci < c.length) {
      if (c[ci] === ch) {
        found = ci;
        break;
      }
      ci++;
    }
    if (found === -1) return null; // ran out of candidate — not a subsequence

    score += found === prevMatch + 1 ? 5 : 1; // contiguous chars are gold
    if (found >= baseStart) score += 3; // inside the filename
    if (found === baseStart) score += 4; // anchored at the filename's start

    prevMatch = found;
    ci = found + 1;
  }

  return score - c.length * 0.01; // prefer the more concise match on ties
}

const lesson: Lesson = {
  kind: "external-cli",
  environment: ["bash", "zsh", "tool:fzf"],
  provenance:
    "fzf — a general-purpose command-line fuzzy finder; you pipe any list into it (files, git branches, history, processes) and type to narrow. Install: `brew install fzf`, `apt install fzf`.",
  synopsis: "fzf [query]",
  explanation:
    "fzf is the universal \"pick one thing from a big list\" tool. Its real power is the pipe pattern: you feed it any newline-separated list on stdin and interactively type to fuzzy-narrow it, then Enter selects the highlighted line. `rg --files | fzf` finds a file by name, `git branch | fzf` picks a branch, `kill -9 $(ps aux | fzf | awk '{print $2}')` picks a process, and `Ctrl-R` (its shell binding) fuzzy-searches your command history. The matching is *subsequence* fuzzy: typing `pgtsx` matches `page.tsx`, so you type the few distinctive characters rather than the whole name. Editor integrations like fzf.vim and Telescope build on the exact same idea — a fuzzy list you narrow to one result. In this trainer we approximate it non-interactively: `fzf <query>` fuzzy-matches the file list and opens the best match for you, while `fzf` alone shows the candidate list.",
  examples: ["fzf", "fzf page", 'nvim "$(fzf)"'],
  seeAlso: ["rg", "zoxide", "find"],
};

const fzf: CommandSpec = {
  name: "fzf",
  summary: "Fuzzy-find and open a file (fuzzy finder)",
  argType: "none",
  handler: ({ args, state, fs }) => {
    const candidates = fs.allPaths().filter((p: string) => fs.isFile(p));
    const query = args.join(" ").trim();

    // No query: this is like opening the picker — show the list, select nothing.
    if (!query) {
      if (candidates.length === 0) {
        return { ok: true, output: ["(fzf — no files to choose from)"] };
      }
      return {
        ok: true,
        output: [...candidates, "(fzf — type `fzf <query>` to fuzzy-select)"],
      };
    }

    // Rank every candidate, dropping the ones the query isn't a subsequence of.
    const ranked = candidates
      .map((path) => ({ path, score: fuzzyScore(query, path) }))
      .filter((r): r is { path: string; score: number } => r.score !== null)
      .sort((a, b) => b.score - a.score || a.path.length - b.path.length);

    if (ranked.length === 0) {
      return { ok: true, output: [`(no matches for "${query}")`] };
    }

    const top = ranked[0].path;
    const shortlist = ranked.slice(0, 5);
    const list = shortlist.map((r, i) => `${i === 0 ? "▶" : " "} ${r.path}`);

    return {
      ok: true,
      output: [...list, `▶ selected: ${top}`],
      statePatch: {
        openedFiles: state.openedFiles.includes(top)
          ? state.openedFiles
          : [...state.openedFiles, top],
        activeFile: top,
      },
      events: [{ type: "open_file", path: top }],
    };
  },
  lesson,
};

export const FZF_COMMANDS: CommandSpec[] = [fzf];
