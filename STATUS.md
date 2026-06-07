# Terminal Invaders — Status

A working snapshot of what's built and what's left. The README is the pitch + how-it-works;
this file is the build tracker. Last updated 2026-06-06.

## TL;DR

The full vertical slice is done and green: a shared engine drives a playable CLI, a browser
app, **and** a real-sandbox mode — all five PRD sprints have landed. The main gap is *content
depth*: the curriculum is designed as 5 tracks × 10 missions (50), and 10 exist today.

- **25 tests passing**, typecheck clean across all 4 projects.
- Run: `pnpm play` (CLI) · `pnpm play sandbox` (real mode) · `pnpm dev` (web) · `pnpm test` · `pnpm typecheck`

## Done

### Engine (`packages/core`) — UI-agnostic, fully unit-tested
- Virtual filesystem (flat path→node map, children derived), path resolver, autocomplete.
- Command parser + registry: `pwd ls cd cat open rg nvim git tree`.
- Latching objective validator (transient conditions like `cwd_is` count once satisfied).
- Scoring: objective points, combo, time bonus, hint/mistake penalties, autocomplete bonus.
- Session engine emitting `GameEvent`s — the engine never touches animation.
- **Simulated nvim** (`editor/editor.ts`): `i/a/I/A/o/O`, `esc`, `:w :q :q! :wq :x`,
  `/search`, `:%s/old/new/g`, `dd`, `gg`, `G`; blocks `:q` on unsaved changes.
- **Simulated git** (`git/git.ts`): HEAD/index/working three-tree model —
  `status diff add restore commit log`; stable per-commit shas.

### Missions (`packages/missions`) — 10 of a target 50
| track       | done | target | missions today                                   |
| ----------- | ---- | ------ | ------------------------------------------------ |
| navigation  | 2    | 10     | `nav-001` Where Am I?, `nav-005` Up and Over     |
| search      | 1    | 10     | `search-005` Hunt the Stale TODO                 |
| lazyvim     | 3    | 10     | `lv-001`, `lv-002`, `lv-010` (boss)              |
| git         | 3    | 10     | `git-001`, `git-005`, `git-009` (boss)           |
| workflow    | 1    | 10     | `hero-copy-001` (full find→search→open→check)    |

### Front-ends
- **`apps/cli`** — readline game: mission select, Tab autocomplete, history, live objective
  checklist, arcade feedback, replay breakdown.
- **`apps/cli` real-sandbox** (`sandbox.ts`) — `pnpm play sandbox [mission]` materializes a
  mission to `~/.terminal-invaders/runs/<id>/project`, `git init`s it, and polls disk + real
  git state while you use your own shell/nvim/git. Core stays env-pure (reads disk back into a
  `VirtualFs`). Path-boundary safety guard; only `isSandboxObservable` objectives auto-check.
- **`apps/web`** — React/Vite app reusing core **unchanged**: terminal-center layout, live
  file tree, mission panel + next-step, autocomplete, arcade mini-map.

### PRD sprints
- [x] Sprint 1 — shared core (headless, tested)
- [x] Sprint 3 (pulled forward) — CLI simulated shell
- [x] Sprint 2 — browser app
- [x] Sprint 5 — real-sandbox mode
- [~] Sprint 4 — mission pack: tracks exist; depth is the open work (below)

## To do

### 1. Deepen the curriculum (the headline gap)
Fill each track to its full 1→5→boss ramp. Each track should ramp difficulty and end in a
"boss" that's a real end-to-end dev task. Concrete next missions:
- **navigation**: deep `cd` chains, `tree` reading, `cd -` / home, find-by-structure.
- **search**: `rg` flags (case, file-type, word), multi-hit triage, search→open→edit chains.
- **lazyvim**: `:%s` with capture intent, multi-file edits, `dd`/`o` refactors, a real
  "rename a symbol across the file" boss.
- **git**: branch/stash awareness, `restore --staged` unstaging drills, "untracked vs
  modified" reading, a "recover from a bad commit" boss.
- **workflow**: more cross-track bosses (change a CTA, fix a broken import, ship a tiny feature).

### 2. Sandbox: polling → `fs.watch`
The watcher polls every 1200ms. Fine for tiny missions, but `fs.watch` (with a debounce) would
feel instant and cut idle CPU. Keep a poll fallback for platforms where watch is flaky (WSL).

### 3. Sandbox observability
Only `file_contains/file_lacks/git_staged/git_clean/git_committed` are checked from disk.
Decide whether nav/search/editor-verb objectives get a sandbox story (e.g. a shell hook /
history scrape) or stay simulator-only. Document the boundary either way.

### 4. Smaller follow-ups
- Real LCS diff if any mission needs a non-trivial `git diff` display (current diff is positional).
- Web app: persist progress / mission completion locally.
- CI: wire `pnpm test` + `pnpm typecheck` on push.

## Later (not MVP)
Procedural mission generation, accounts, leaderboards, full Vim emulation, real read-only
project import, daily drills, attract/demo mode, LazyVim "spell cards", per-skill stats
("fast at navigation, weak at search — replay Search 03").

## North star
> A terminal simulator with arcade feedback — not an arcade game with terminal stickers.

Every feature answers one question: *does this help someone get faster at real dev terminal
workflow?* If yes, keep it. If it's only neon, cut it.
