# Mega Prompt — Finish Terminal Invaders in One Shot

> Hand this entire file to a coding agent (or run it as a 5-way fan-out, one agent per track + a
> serial merge/polish pass). It is self-contained: schema, conventions, the exact mission roster,
> the polish work, the correctness traps, and the definition of done.

---

## 0. Mission

Take Terminal Invaders from **10 missions to the full 50** (5 tracks × 10, each ramping
difficulty 1→…→boss) and close the remaining polish items, leaving the repo **green**:
`pnpm typecheck` clean, `pnpm test` passing (with a new solvability test per new mission),
and both front-ends auto-rendering all 50 missions. Do **not** change engine/editor/git/validator
*behavior* that the existing tests rely on — only add missions, tests, and the scoped polish below.

**Repo root:** `/home/natkins/n8builds/meme/terminal-invaders` (pnpm 10.8.1 workspace, Node 22+,
runs `.ts` directly via tsx/Vite — no build step). Commit after each logical chunk.

---

## 1. How a mission is authored (the contract)

One mission = one file: `packages/missions/src/<track>/<camelCaseName>.ts`, exporting a single
`export const <camelCaseName>: Mission = { … }`. **Filename = export name** (camelCase), **not** the
id, **not** the folder. Folder name = the mission's `track` value exactly.

```ts
// packages/missions/src/git/whatChanged.ts  (annotated reference — copy this shape)
import type { Mission } from "@terminal-invaders/core";   // always first; type-only import

// Git track convention: hoist file contents to SCREAMING_SNAKE_CASE constants so the committed
// (head) and working-tree versions are easy to keep in sync.
const HEAD_CONFIG = "export const config = {\n  retries: 3,\n  timeout: 1000,\n};";
const WORKING_CONFIG = "export const config = {\n  retries: 5,\n  timeout: 1000,\n};"; // differs -> starts dirty

export const whatChanged: Mission = {
  id: "git-001",                 // <track-prefix>-NNN, globally unique
  title: "What Changed?",        // Title Case; boss missions append " (boss)"
  difficulty: 1,                 // literal 1|2|3|4|5 (label only — does NOT affect scoring)
  track: "git",                  // must equal the folder name + be a MissionTrack literal
  briefing:                      // 2nd-person; names the exact commands; ends "...then check."
    "Someone edited config.ts but you don't know what they changed. Use `git status`, then `git diff`. Then check.",
  startingCwd: "/project",       // absolute; MUST exist as a dir node below
  filesystem: {                  // FLAT path -> FsNode map; parents are DERIVED from paths
    "/project": { type: "dir" }, // ...so list EVERY directory segment explicitly
    "/project/config.ts": { type: "file", content: WORKING_CONFIG },
    "/project/README.md": { type: "file", content: "# Service" },
  },
  git: { head: {                 // ONLY on git-track missions; committed snapshot path->content
    "/project/config.ts": HEAD_CONFIG,   // differs from filesystem -> diff exists at start
    "/project/README.md": "# Service",
  } },
  objectives: [                  // ordered; mission completes when ALL true; ALWAYS end with check
    { id: "status", label: "Check the repo state (git status)", type: "git_subcommand_used", sub: "status" },
    { id: "diff",   label: "See what changed (git diff)",       type: "git_subcommand_used", sub: "diff" },
    { id: "check",  label: "Run check",                          type: "command_used", command: "check" },
  ],
  hints: [                       // ordered easy-nudge -> literal command; ~2 for d1, 2-3 for d2/3
    { text: "`git status` shows which files are modified." },
    { text: "`git diff` shows the exact lines that changed." },
  ],
  successMessage: "status then diff — always know what changed before you act.",
};
```

**Field order** across all files: `id, title, difficulty, track, briefing, startingCwd, filesystem,
(git?), objectives, (allowedCommands?), hints, successMessage`.

### Objective types (the complete set the validator understands)

| `type` | params | satisfied when | sandbox-observable* |
|---|---|---|---|
| `cwd_is` | `path` | `state.cwd === path` (exact) | no |
| `file_opened` | `path` | path in `openedFiles` (open/nvim/cat) | no |
| `search_performed` | `query`, `expectedPath?` | a search's query case-insens. substring-matches; if `expectedPath` set it must be among that search's match paths (exact) | no |
| `file_contains` | `path`, `text` | file exists **and** content includes `text` (**case-SENSITIVE** substring) | **yes** |
| `file_lacks` | `path`, `text` | file **exists** and does **not** include `text` (case-sensitive) | **yes** |
| `command_used` | `command` | shell command name in `commandsUsed` | no |
| `editor_command_used` | `command` | normalized editor verb in `editorCommandsUsed` | no |
| `editor_search` | `pattern` | an in-nvim `/pattern` matches (case-insens. substring) | no |
| `git_subcommand_used` | `sub` | git subcommand string was run | no |
| `git_staged` | `path` | path's index differs from HEAD | **yes** |
| `git_clean` | `path` | path is neither staged nor modified (== HEAD) | **yes** |
| `git_committed` | — | `gitCommits > 0` this run | **yes** |

*Normalized editor verbs:* insert `i/a/I/A/o/O` → `'i'`; `esc`; `dd`; `/`; `:w`; `:q`; `:q!`;
`:wq`/`:x` → `':wq'`; any substitute → `':%s'`. **Any write auto-records `':w'`** (so a `:w`
objective is satisfied by `:wq` too).

### Scoring (so you can author balanced missions — all engine-driven, nothing per-mission)
Objective base 100, +25 per combo step; search bonus +20/qualifying search; autocomplete bonus +10
once; mistake −25 (and zeroes combo); hint −50 (and zeroes combo); time bonus up to 200, full if
finished within **PAR = 90s** (hardcoded, not per-mission), 0 at 270s. A mission is only marked
complete when the player runs **`check`** with all objectives latched true.

---

## 2. Hard constraints / traps (read before writing a single mission)

1. **List every directory node explicitly.** Children are derived from paths; there is *no*
   recursive parent creation. `/project`, `/project/src`, `/project/src/app` are three entries.
2. **`startingCwd` and every objective `path`/`expectedPath` must point at a node that exists** in
   `filesystem`. nvim on a non-file records a `bad_path` mistake and does **not** open the editor.
3. **`file_lacks` requires the file to EXIST** but not contain the text. A missing file does **not**
   satisfy it. `file_contains` returns false for a missing file.
4. **Case sensitivity differs:** `file_contains`/`file_lacks` are case-**sensitive** substrings;
   `search_performed`/`editor_search` are case-**insensitive**. Pick `text` carefully — a substring
   of unrelated content will match.
5. **The editor inserts lines BELOW the cursor and cannot delete arbitrary text** except via `dd`
   (whole line) or `:%s`. So a `file_lacks` of pre-existing text is only reachable via `:%s`
   substitution or `dd`, never via insert. Plan editor missions accordingly.
6. **`:q` is blocked on unsaved changes** (prints "No write since last change"). Save-bearing
   missions must drive `:w`/`:wq`.
7. **Git missions MUST set `git.head`.** Without it `git …` returns "fatal: not a git repository"
   and no `git_*` objective is reachable. Working-tree (`filesystem`) vs `head` content sets the
   initial dirty/clean state: differ → starts dirty (diff/restore missions); for stage-and-commit,
   put OLD in head and NEW in filesystem so there's something to add+commit.
8. **Objectives latch by `id`** — keep ids unique within a mission (a latched id stays satisfied
   even if the condition later flips; that's why transient `cwd_is`/editor verbs count).
9. **Always end with** `{ type: "command_used", command: "check" }` (self-satisfies during check).
10. **`allowedCommands`:** empty/undefined = ALL allowed. To restrict you must list a non-empty
    whitelist — and then include `"nvim"`/`"git"` explicitly if the mission uses them
    (`check/help/hint/clear/reset` are always available). The current 10 missions don't set it;
    prefer leaving it unset.
11. **`difficulty` is a label only** — it does not change scoring. There is no `parSeconds` field.
12. **`track: "edit"` is reserved** (no folder/missions). Editor missions use `track: "lazyvim"`.
13. **Sandbox eligibility:** real-sandbox mode only auto-checks the 5 disk-observable objective
    kinds (see table). If you want a mission to be playable in `pnpm play sandbox`, give it at least
    one observable objective; otherwise it's simulator-only (that's fine for nav/search/editor).

---

## 3. Registration (single merge point)

For each new mission, edit **only** `packages/missions/src/index.ts`:
1. Add the file under `packages/missions/src/<track>/`.
2. Add `import { <name> } from "./<track>/<name>.ts";` (explicit `.ts`, grouped by track).
3. Insert into the ordered `MISSIONS: Mission[]` array **by difficulty/flow** (it interleaves
   tracks, roughly increasing difficulty — the CLI uses array order for "next" and 1-based select;
   web maps it for the picker). Don't blindly append.
4. Add the name to the bottom `export { … }` block (so tests/consumers can import it by name).

Both front-ends (`apps/cli`, `apps/web`) consume `MISSIONS` dynamically — **no per-app wiring**.

---

## 4. Deliverable A — the 40 new missions (roster)

Keep the existing anchor missions; fill the gaps so each track has 10 with a clean 1→…→boss ramp.
Ids/titles below are a **starting roster** — refine wording freely, but preserve the ramp, the
anchors, the `(boss)` finale, and the per-track teaching focus. ✅ = already exists, don't touch.

### navigation (cd/pwd/ls/tree/relative paths — no git/editor)
- `nav-001` Where Am I? (1) ✅ · `nav-005` Up and Over (2) ✅
- `nav-002` Look Around (1) — `ls`, `ls <dir>`, `cat` a landmark file
- `nav-003` Step Inside (1) — `cd` one level down, `pwd` (`cwd_is`)
- `nav-004` Read the Tree (2) — `tree` to learn structure, then `cd` to a deep dir it revealed
- `nav-006` Home and Back (2) — `cd ~` then `cd -` to return (`cwd_is` at each)
- `nav-007` Deep Chain (3) — multi-level `cd a/b/c/d`, then open the file there
- `nav-008` Sideways and Down (3) — combined `cd ../../x/y` relative move
- `nav-009` Find by Convention (3) — locate a config by knowing where it lives, open it
- `nav-010` Survey the Codebase **(boss, 3)** — `tree` → walk several dirs → open the real entrypoint

### search (rg / content search — `search_performed` with `expectedPath`)
- `search-005` Hunt the Stale TODO (2) ✅
- `search-001` First Grep (1) — `rg <word>`, plant the needle in exactly one file (`expectedPath`)
- `search-002` Search then Open (1) — `rg`, then open the hit (`search_performed` + `file_opened`)
- `search-003` The Right Match (2) — near-miss decoys in other files; match the exact term in the target
- `search-004` Find the Definition (2) — search a symbol, open where it's defined
- `search-006` Filter the Noise (2) — term appears in several files; find the one that matters
- `search-007` Exact Symbol (3) — distinguish a whole symbol from substrings of it
- `search-008` Triage Hits (3) — multiple legitimate hits; open the culprit
- `search-009` Search → Open → Read (3) — full chain to the right line
- `search-010` Track Down the Bug **(boss, 3)** — find an error string, then find its call site (two `search_performed`), open both

### lazyvim (nvim loop — `editor_command_used` / `editor_search`, verify with `file_contains/lacks`)
- `lv-001` Open, Look, Leave (1) ✅ · `lv-002` Save Your Work (2) ✅ · `lv-010` Replace the Copy **(boss, 3)** ✅
- `lv-003` Insert a Line (1) — `nvim`, `i`, type a line, `esc`, `:w` → `file_contains`
- `lv-004` Append at the End (2) — `o`/`A` to add below, save → `file_contains`
- `lv-005` Search in File (2) — `/pattern` (`editor_search`), `:q`
- `lv-006` Delete a Line (2) — `dd`, `:w` → `file_lacks` the removed text
- `lv-007` Open Below (2) — `o` to insert a new line, save → `file_contains`
- `lv-008` One-Shot Substitute (3) — `:%s/old/new/g`, save → `file_contains` new + `file_lacks` old
- `lv-009` Refactor Pass (3) — combine `dd` + `o`/`i` (or `:%s`) then save; `file_lacks` + `file_contains`

### git (status/diff/add/restore/commit/log — every mission sets `git.head`)
- `git-001` What Changed? (1) ✅ · `git-005` Stage and Commit (2) ✅ · `git-009` Undo the Mistake **(boss, 3)** ✅
- `git-002` Stage the Change (1) — `git status`, `git add <file>` → `git_staged`
- `git-003` Commit It (2) — `git add` + `git commit -m` → `git_committed`
- `git-004` Inspect the History (1) — `git log` + `git status` (`git_subcommand_used`)
- `git-006` Discard Working Changes (2) — starts dirty; `git restore <file>` → `git_clean` + `file_contains` HEAD content
- `git-007` Inspect Before You Commit (2) — dirty file: status → diff → add → commit → `git_committed`
- `git-008` Restore Just One (3) — two dirty files; restore only the target → `git_clean(target)` + `file_contains` (other still dirty)
- `git-010` Clean Slate **(boss, 3)** — diff to inspect → `restore` the bad file → `add`+`commit` the good one → `git_clean(bad)` + `git_committed` + file checks

> Git engine supports only `status diff add restore commit log`. Do **not** author missions needing
> `reset`/`revert`/`branch`/`stash` — they aren't implemented. (If a mission needs a non-trivial
> multi-line `git diff` display, see Deliverable C #5 — current diff is positional, not LCS.)

### workflow (cross-track capstones — chain nav + search + editor + git)
- `hero-copy-001` Find the Hero Copy (1) ✅
- `workflow-002` Read the Config (1) — navigate + open + read a config (`cwd_is` + `file_opened`)
- `workflow-003` Locate and Open (2) — search a symbol, `cd` to it, open it
- `workflow-004` Change the CTA (2) — search "Start now", open in nvim, `:%s` to new copy, save → `file_contains`/`file_lacks`
- `workflow-005` Fix the Typo (2) — search the misspelling, open, `:%s` fix, save
- `workflow-006` Add an Export (2) — find the file, `o` a new line, save → `file_contains`
- `workflow-007` Fix a Broken Import (3) — search the bad path, open, `:%s` to the correct path, save → `file_contains`/`file_lacks`
- `workflow-008` Edit and Commit (3) — open + edit + save, then `git add`+`commit` → `file_contains` + `git_committed` (needs `git.head`)
- `workflow-009` Search, Fix, Verify (3) — search a bug string, open in nvim, fix via `:%s`, save, confirm it's gone → `search_performed` + `file_contains` (fix) + `file_lacks` (old)
- `workflow-010` Ship a Tiny Feature **(boss, 3)** — full chain: `tree`/navigate → `rg` → open in nvim → edit (`o`/`:%s`) → save → `git add` → `git commit` → `file_contains` + `git_committed` (needs `git.head`)

> Workflow ids use a topical-slug style (`hero-copy-001`); `workflow-NNN` is acceptable and clearer
> for the new ones. Stay consistent within the track.

**Counts:** nav +8, search +9, lazyvim +7, git +7, workflow +9 = **40 new → 50 total.**

---

## 5. Deliverable B — prove every new mission is solvable

Tests are **static** (no auto-discovery): `packages/core/test/tracks.test.ts` imports missions by
name and replays a fixed input script. For each new mission add a solvability test mirroring the
existing pattern (extend `tracks.test.ts`, or add `packages/missions/test/<track>.test.ts` — any
`*.test.ts` under `packages/**/test/` or `apps/**/test/` is auto-collected by `vitest.config.ts`):

```ts
import { GameEngine } from "@terminal-invaders/core";
import { myMission } from "@terminal-invaders/missions";

function play(e: GameEngine, inputs: string[]) { for (const i of inputs) e.execute(i); }

it("solves <id>", () => {
  const e = new GameEngine(myMission);
  play(e, [ /* exact player input lines, ending with "check" */ ]);
  expect(e.state.complete).toBe(true);
  // edits:  expect(e.fs.readFile("/project/…")).toContain("…")
  // git:    expect(e.state.gitCommits).toBeGreaterThan(0)
});
```

Input lines are raw shell/editor text exactly as typed: shell (`cd src`, `nvim page.tsx`,
`rg "Start now"`, `git add x`, `git commit -m "msg"`, `check`) and — **while nvim is open** —
editor lines (`i`, the text, `esc`, `:%s/old/new/g`, `:wq`, `/pattern`). If `state.complete` is
false, the final `check` step prints `Not yet. Missing:` with the unsatisfied objective label —
that pinpoints the mismatch (usually a normalized verb, an absolute-vs-relative path, or a
case-sensitivity slip).

---

## 6. Deliverable C — polish items

1. **Sandbox watcher: polling → `fs.watch`** (`apps/cli/src/sandbox.ts`, currently a
   `while (completed.size < total)` loop with `sleep(1200)` at ~L209–214). Replace with an
   event-driven `fs.watch` (recursive over the run's project tree) + a debounce so a burst of writes
   collapses into one revalidation. **Keep the poll loop as a fallback** — `fs.watch` (and recursive
   watch) is flaky on WSL, and this repo runs under WSL2. Preserve the latching `completed` Set and
   the `snapshotGit` "committed-and-diverged counts as staged" behavior so the stage→commit-across-
   ticks case doesn't regress (covered by the git-005 sandbox test).
2. **Sandbox observability — decide + document** (`packages/core/src/missions/validator.ts`,
   `isSandboxObservable` doc comment + STATUS.md/README). Decide whether the 7 non-observable kinds
   (`cwd_is`, `file_opened`, `command_used`, `editor_command_used`, `editor_search`,
   `git_subcommand_used`, `search_performed`) get a sandbox story (e.g. shell-hook / history scrape)
   or stay simulator-only, and **document the boundary either way** — the simplest correct outcome
   is "simulator-only; sandbox checks the 5 disk-observable kinds," written down clearly so mission
   authors know non-observable objectives are dropped from sandbox scoring.
3. **CI** — add `.github/workflows/ci.yml` on push + pull_request: `actions/checkout@v4` →
   `pnpm/action-setup@v4` (version **10.8.1**, matches `packageManager`) → `actions/setup-node@v4`
   (node 22, `cache: pnpm`) → `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm test`.
   No build step needed (both scripts are self-contained).
4. **Web progress persistence** (`apps/web/src/App.tsx`, `MissionPanel`/picker). Today state is
   in-memory only. Add a localStorage layer: persist completed mission ids (+ best score) on
   `mission_complete`, and surface done/locked state on the picker cards (which currently show only
   track/title/difficulty). Don't regress the per-mission remount-by-id behavior.
5. **Real LCS git diff** (`packages/core/src/git/git.ts` `lineDiff()` ~L132–148 — currently
   positional: compares line N to line N, so one inserted line marks everything after as changed).
   Switch to an LCS-based diff **if** any new mission needs a non-trivial multi-line `git diff`
   display. If no mission needs it, leave it and note so.
6. **Update `STATUS.md`** to reflect 50/50 missions and the closed items, and bump the test count.

---

## 7. Definition of done (verification gates — all must pass)

- [ ] `pnpm typecheck` — clean across all 4 projects.
- [ ] `pnpm test` — green, including one solvability test per **new** mission.
- [ ] `MISSIONS` contains **50** missions, ordered by difficulty/flow; each new mission is also in
      the named `export { … }` block.
- [ ] Spot-check a few: `pnpm play <id>` launches and is completable; `pnpm play sandbox <id>`
      works for at least one sandbox-eligible new mission; `pnpm dev` builds and the picker lists 50.
- [ ] Polish items 1–6 done (or, for #5, explicitly justified as not needed).
- [ ] `STATUS.md` updated; work committed in logical chunks with the `Co-Authored-By` trailer.

---

## 8. Suggested execution (for a "one shot" run)

Missions are independent files; the only shared write is `index.ts`. Recommended:
1. **Fan out 5 track-authoring agents in parallel** — each creates its track's new mission files +
   that track's solvability tests. They do **not** touch `index.ts`.
2. **Serial merge:** one agent adds all imports/array entries/re-exports to `index.ts` in the right
   order, then runs `pnpm typecheck && pnpm test`, fixing any `Not yet. Missing:` mismatches.
3. **Polish pass:** items in Deliverable C (these touch distinct files: sandbox.ts, validator.ts +
   docs, .github/, apps/web, git.ts — safe to parallelize).
4. **Final verify** against Section 7, update STATUS.md, commit.
