# Terminal Invaders — Status

A working snapshot of what's built and what's left. The README is the pitch + how-it-works;
this file is the build tracker. Last updated 2026-06-20.

## TL;DR

The full vertical slice is done and green: a shared engine drives a playable CLI, a browser
app, **and** a real-sandbox mode. **All five PRD sprints have landed, including Sprint 4** —
the curriculum is filled out to its designed depth of **5 tracks × 10 missions = 50**.

- **66 tests passing**, typecheck clean across all 4 projects.
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
  `status diff add restore commit log`; stable per-commit shas; **LCS-based line diff**.

### Missions (`packages/missions`) — 50 of 50 (complete)
Each track ramps difficulty 1 → 2 → 3 and ends in a boss that's a real end-to-end dev task.
| track       | done  | target | mission ids                              |
| ----------- | ----- | ------ | ---------------------------------------- |
| navigation  | 10    | 10     | `nav-001` … `nav-010`                    |
| search      | 10    | 10     | `search-001` … `search-010`              |
| lazyvim     | 10    | 10     | `lv-001` … `lv-010` (boss: `lv-010`)     |
| git         | 10    | 10     | `git-001` … `git-010` (boss: `git-010`)  |
| workflow    | 10    | 10     | `hero-copy-001`, `workflow-002` … `workflow-010` (boss: `workflow-010`) |

Missions are sequenced into one ordered campaign in `missions/src/index.ts` (three difficulty
tiers, rotating tracks so no single skill dominates a stretch). The mission test suites solve
each mission end-to-end; an unsolved walkthrough surfaces as the engine's `Not yet. Missing:`
output naming the unmet objective.

### Front-ends
- **`apps/cli`** — readline game: mission select, Tab autocomplete, history, live objective
  checklist, arcade feedback, replay breakdown.
- **`apps/cli` real-sandbox** (`sandbox.ts`) — `pnpm play sandbox [mission]` materializes a
  mission to `~/.terminal-invaders/runs/<id>/project`, `git init`s it, and watches disk + real
  git state while you use your own shell/nvim/git. Core stays env-pure (reads disk back into a
  `VirtualFs`). Path-boundary safety guard; only `isSandboxObservable` objectives auto-check.
- **`apps/web`** — React/Vite app reusing core **unchanged**: terminal-center layout, live
  file tree, mission panel + next-step, autocomplete, arcade mini-map. **Per-mission progress
  persisted to `localStorage`** (`apps/web/src/lib/progress.ts`).

### PRD sprints
- [x] Sprint 1 — shared core (headless, tested)
- [x] Sprint 3 (pulled forward) — CLI simulated shell
- [x] Sprint 2 — browser app
- [x] Sprint 5 — real-sandbox mode
- [x] Sprint 4 — mission pack: all 5 tracks filled to 10 missions each (50 total)

## To do

### 1. Deepen the curriculum — DONE
- [x] Filled every track to its full 1 → 5 → boss ramp (50 missions, 10 per track), each
  ending in a real end-to-end boss task (rename-a-symbol, recover-from-a-bad-commit,
  ship-a-tiny-feature, etc.).

### 2. Sandbox: polling → `fs.watch` — DONE
- [x] The watcher prefers an event-driven recursive `fs.watch` with a 200ms debounce
  (`WATCH_DEBOUNCE_MS`), and keeps a 1200ms poll fallback (`POLL_INTERVAL_MS`) for platforms
  where recursive watch is flaky (WSL2 / network mounts). See `watchUntilComplete` in
  `apps/cli/src/sandbox.ts`.

### 3. Sandbox observability — DONE (boundary documented)
- [x] The boundary is defined and documented in `validator.ts` (`isSandboxObservable`): only
  the 5 disk-observable kinds (`file_contains/file_lacks/git_staged/git_clean/git_committed`)
  auto-check from disk; the other 7 kinds (nav/search/editor-verb) are simulator-only, with no
  shell hook / history scrape. A mission is sandbox-eligible iff it has ≥1 observable objective.

### 4. Smaller follow-ups — DONE
- [x] Real LCS diff for `git diff` display (`packages/core/src/git/git.ts`).
- [x] Web app: persist progress / mission completion locally (`localStorage`).
- [x] CI: `pnpm test` + `pnpm typecheck` wired on push/PR (`.github/workflows/ci.yml`).

## Later (not MVP)
Procedural mission generation, accounts, leaderboards, full Vim emulation, real read-only
project import, daily drills, attract/demo mode, LazyVim "spell cards", per-skill stats
("fast at navigation, weak at search — replay Search 03").

## North star
> A terminal simulator with arcade feedback — not an arcade game with terminal stickers.

Every feature answers one question: *does this help someone get faster at real dev terminal
workflow?* If yes, keep it. If it's only neon, cut it.
</content>
</invoke>
