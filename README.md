# Terminal Invaders

> An arcade-style terminal trainer. Real command-line reps via mission-based gameplay —
> not six hours of docs.

You complete realistic dev workflows (find a file, search a codebase, open it, run a check)
by typing real commands. The file tree changes, objectives tick off, and you get score +
combo feedback. The goal is **terminal/Neovim/Ghostty muscle memory**, built through reps.

```
ls                      →  see where you are
cd src/app              →  move through the tree
rg "Start now"          →  search by content
nvim page.tsx           →  open the match
check                   →  validate the mission
```

## Status

**Vertical slice working** — shared engine + a playable CLI, validated end-to-end.

- ✅ `packages/core` — virtual filesystem, command parser, resolver, autocomplete, objective
  validator, scoring, session engine. Fully unit-tested.
- ✅ `packages/missions` — 10 missions across navigation / search / lazyvim / git / workflow.
- ✅ Simulated **nvim** editor (i/esc/insert, `:w` `:q` `:wq`, `/search`, `:%s/old/new/g`, `dd`).
- ✅ Simulated **git** (HEAD/index/working: `status` `diff` `add` `restore` `commit` `log`).
- ✅ `apps/cli` — playable readline game: mission select, Tab autocomplete, history,
  live objective checklist, arcade feedback, replay breakdown.
- ✅ `apps/web` — browser version (React/Vite) reusing the **same core engine**:
  terminal-center layout, live file tree, mission panel + next-step, Tab autocomplete,
  objective checklist, and an arcade mini-map.
- ✅ **Real-sandbox mode** — writes a mission to disk in an isolated folder, `git init`s it,
  and watches while you use your *real* shell / nvim / git, auto-scoring from disk + git state.

## Quick start

```bash
pnpm install
pnpm play            # launch the CLI, pick a mission from the menu
pnpm play hero-copy-001   # or jump straight to a mission by id/number
pnpm dev             # launch the browser version (Vite dev server)
pnpm play sandbox            # REAL mode: pick a sandbox mission
pnpm play sandbox git-009    # REAL mode: jump straight to one
pnpm test            # run the core engine + sandbox tests
pnpm typecheck       # tsc across all packages
```

Requires Node 22+ and pnpm 10+. The CLI runs `.ts` directly via `tsx` (no build step); the
web app resolves the workspace packages straight to their TS source via Vite.

## How it fits together

The whole product is **one shared engine** with thin front-ends, so the browser and
terminal versions can never drift apart.

```
terminal-invaders/
  packages/
    core/        @terminal-invaders/core      ← the engine (UI-agnostic)
      fs/        virtualFs, pathUtils
      commands/  parser, registry (pwd/ls/cd/cat/open/rg/nvim/tree), autocomplete
      missions/  types, validator
      scoring/   points, combo, time bonus
      session/   engine (the orchestrator), state, events
    missions/    @terminal-invaders/missions   ← mission content (JSON-ish TS)
  apps/
    cli/         @terminal-invaders/cli         ← readline front-end
    web/         @terminal-invaders/web         ← React/Vite front-end
```

### The core loop

```
input → parseCommand → command handler → CommandResult{output, statePatch, events}
      → engine merges state → re-evaluates objectives (latched) → awards score
      → emits GameEvents → UI renders feedback
```

The engine **never touches animation**. It emits `GameEvent`s (`move`, `open_file`,
`search`, `objective_complete`, `score`, `mission_complete`) and each front-end decides how
to render them. That's why the same engine drives both a plain terminal and (later) an
arcade-y browser UI.

### Key design decisions made while building

- **Flat filesystem map.** Mission authors list nodes by absolute path
  (`"/project/src/app/page.tsx"`); parent/child links are derived. No `children` arrays to
  keep in sync.
- **Objectives latch.** `cwd_is` is only true *while you stand there*. So once an objective
  is satisfied it stays satisfied — `check` judges against what you've accomplished, not the
  momentary state. (This was a real bug caught by the first test.)
- **Errors are the coach.** A bad `cd` lists what's actually available; a missing file
  suggests the closest match. The game teaches through its error messages.

### Two ways to play a mission

- **Simulated** (`pnpm play`, `pnpm dev`) — the engine simulates the shell, nvim, and git.
  Fast, zero-setup, runs anywhere. Every objective type is checkable because the engine sees
  every command.
- **Real sandbox** (`pnpm play sandbox`) — the mission is written to a throwaway folder and you
  drive your *actual* tools. The engine can't see your keystrokes, so it scores from the
  resulting disk + git state. This lives in `apps/cli/src/sandbox.ts` (it needs `node:fs` /
  `child_process`); **core stays environment-pure** and is reused for validation by reading the
  disk back into a `VirtualFs`.

#### Sandbox observability

Because the sandbox can only read disk + git state (no shell hook, no keystroke capture), it
auto-checks **only the 5 disk-observable objective kinds**: `file_contains`, `file_lacks`,
`git_staged`, `git_clean`, and `git_committed`. The other 7 — `cwd_is`, `file_opened`,
`command_used`, `editor_command_used`, `editor_search`, `git_subcommand_used`, and
`search_performed` — describe transient actions, not a resulting disk state, so they stay
**simulator-only** and are silently dropped from sandbox scoring. The boundary is defined by
`isSandboxObservable` in `packages/core/src/missions/validator.ts`. A mission is therefore
**sandbox-eligible only if it has at least one disk-observable objective**; a mission made
entirely of non-observable kinds (pure navigation / search / editor-verb drills) is
simulator-only, which is fine.

## The missions

**50 missions across 5 tracks** (10 each), each ramping difficulty 1 → 2 → 3 and ending in a
"boss" that's a real end-to-end task. The full ordered campaign lives in
`packages/missions/src/index.ts`.

| track       | ids                          | teaches                                                    | boss                                  |
| ----------- | ---------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| navigation  | `nav-001` … `nav-010`        | `pwd`/`ls`/`cd`, relative paths, `tree`, deep chains       | `nav-010` Survey the Codebase         |
| search      | `search-001` … `search-010`  | `rg` by content, exact-symbol vs substring, triage hits    | `search-010` Track Down the Bug       |
| lazyvim     | `lv-001` … `lv-010`          | `nvim` loop, insert/`dd`/`:w`, `/search`, `:%s`            | `lv-010` Replace the Copy             |
| git         | `git-001` … `git-010`        | `status`/`diff`/`add`/`commit`/`restore`, recover & ship   | `git-010` Clean Slate                 |
| workflow    | `hero-copy-001`, `workflow-002` … `workflow-010` | cross-track chains: navigate → search → edit → commit | `workflow-010` Ship a Tiny Feature    |

### Authoring a new mission

Add a `Mission` object (see `packages/missions/src/workflow/heroCopy.ts`) and register it in
`packages/missions/src/index.ts`. Objective types available today:

- `command_used` — player ran a command
- `cwd_is` — player reached a directory
- `file_opened` — player opened a file (via `open`/`cat`/`nvim`)
- `search_performed` — player searched a query (optionally hitting an expected file)
- `file_contains` / `file_lacks` — a file's contents include / no longer include some text
- `editor_command_used` — player used an nvim verb (`i`, `:w`, `:wq`, `:%s`, `dd`, …)
- `editor_search` — player searched inside the editor with `/pattern`
- `git_subcommand_used` — player ran a git subcommand (`status`, `diff`, …)
- `git_staged` / `git_clean` / `git_committed` — git working-tree state

For a git mission, add a `git: { head: { "<path>": "<committed content>" } }` block. If a
file's working content (in `filesystem`) differs from its `head` entry, the run starts with
uncommitted changes — perfect for "fix it" / "recover" missions.

## Roadmap

Built in the order the PRD recommends, adjusted to ship the useful part first.

- [x] **Sprint 1 — Shared core.** Engine works headless, under test.
- [x] **Sprint 3 (pulled forward) — CLI simulated shell.** Playable now. *(Prioritized over
  the browser because it's what's actually useful for daily terminal/LazyVim reps.)*
- [x] **Sprint 2 — Browser v2.** React/Vite app in `apps/web`: terminal-center layout, file
  tree, mission panel + next-step, autocomplete, small arcade mini-map. Reuses `core` as-is —
  the engine is imported unchanged, proving the shared-core architecture.
- [~] **Sprint 4 — Mission pack.** LazyVim basics and Git safety tracks landed (with
  simulated nvim + git engines). Still to do: deepen each track toward the full 10-per-track
  curriculum.
- [x] **Sprint 5 — Real sandbox mode.** `pnpm play sandbox <mission>` writes a mission folder
  to `~/.terminal-invaders/runs/...` (git-init'd when the mission uses git), and you use your
  *real* Ghostty + nvim + git while the watcher validates from disk + git state. Always
  isolated — it refuses to operate outside the sandbox base, so your real projects are never
  touched. This is where real LazyVim/git muscle memory happens.

  Only objectives observable from disk are auto-checked in sandbox mode (`file_contains`,
  `file_lacks`, `git_staged`, `git_clean`, `git_committed`) — see `isSandboxObservable`. A
  mission needs at least one such objective to be sandbox-eligible. Because the watcher polls
  rather than intercepts, transient git states are treated as "staged-or-committed" so a fast
  stage→commit still latches.

### Tracks (the curriculum)

`navigation` · `search` · `lazyvim` · `git` · `workflow` — each ramps difficulty 1→5 ending
in a "boss" that's a real end-to-end dev task (change a CTA, fix a broken import, ship a
tiny feature).

### Later (not MVP)

Procedural mission generation, accounts, leaderboards, full Vim emulation, real project
import, daily drills, attract/demo mode, LazyVim "spell cards", skill-dimension stats
("you're fast at navigation but weak at search — replay Search 03").

## The north star

> A terminal simulator with arcade feedback — not an arcade game with terminal stickers.

Every feature gets one question: *does this help someone get faster at real dev terminal
workflow?* If yes, keep it. If it's only neon, cut it.
