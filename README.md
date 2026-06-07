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
- ⏳ `apps/web` — browser version (not built yet — see roadmap).
- ⏳ Real sandbox mode (write missions to disk, watch real `nvim`/`git`).

## Quick start

```bash
pnpm install
pnpm play            # launch the CLI, pick a mission from the menu
pnpm play hero-copy-001   # or jump straight to a mission by id/number
pnpm test            # run the core engine tests
pnpm typecheck       # tsc across all packages
```

Requires Node 22+ and pnpm 10+. The CLI runs `.ts` directly via `tsx` (no build step).

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
    web/         (planned) React/Vite front-end
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

## The missions (current)

| id              | title                  | track       | teaches                              |
| --------------- | ---------------------- | ----------- | ------------------------------------ |
| `nav-001`       | Where Am I?            | navigation  | `pwd` + `ls` to orient               |
| `nav-005`       | Up and Over            | navigation  | relative paths, `cd ../sibling`      |
| `search-005`    | Hunt the Stale TODO    | search      | `rg` to find by content              |
| `lv-001`        | Open, Look, Leave      | lazyvim     | `nvim`, `/search`, `:q`              |
| `lv-002`        | Save Your Work         | lazyvim     | `i` → type → `esc` → `:wq`           |
| `git-001`       | What Changed?          | git         | `git status`, `git diff`             |
| `git-005`       | Stage and Commit       | git         | `git add`, `git commit -m`          |
| `lv-010`        | Replace the Copy       | lazyvim     | `:%s/old/new/g` (boss)              |
| `git-009`       | Undo the Mistake       | git         | `git restore` to recover safely (boss) |
| `hero-copy-001` | Find the Hero Copy     | workflow    | the full find→search→open→check      |

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
- [ ] **Sprint 2 — Browser v2.** React/Vite app in `apps/web`: terminal-center layout, file
  tree, mission panel + next-step, autocomplete, small arcade mini-map. Reuses `core` as-is.
- [~] **Sprint 4 — Mission pack.** LazyVim basics and Git safety tracks landed (with
  simulated nvim + git engines). Still to do: deepen each track toward the full 10-per-track
  curriculum.
- [ ] **Sprint 5 — Real sandbox mode.** `terminal-invaders start <mission> --real` writes a
  mission folder to `~/.terminal-invaders/runs/...`, you use your *real* Ghostty + nvim +
  git, and a file watcher validates. This is where real LazyVim practice happens. Always
  isolated — never touches your real projects.

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
