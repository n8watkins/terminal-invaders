import type { Lesson } from "../lessons/types.ts";

/**
 * Teaching cards for the editor verbs this trainer's simulated nvim records.
 *
 * These are Vim/Neovim commands you type INSIDE the editor, not commands you run
 * at the shell prompt. This trainer's nvim is a deliberately simplified, line-based
 * simulation: it teaches the *vocabulary and rhythm* of editing — i → type → esc →
 * :w → :q — rather than emulating raw keystrokes. The keys here are the normalized
 * verbs the engine records for objectives (e.g. all of i/a/I/A/o/O normalize to "i").
 */
export const EDITOR_LESSONS: Record<string, Lesson> = {
  i: {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "A Vim/Neovim normal-mode verb typed inside the editor, not a shell command. In this simplified trainer, i/a/I/A/o/O all drop you into insert mode and are recorded as `i`.",
    synopsis: "i  (also a, I, A, o, O)",
    explanation:
      "Vim starts in NORMAL mode, where letters are commands rather than text. To actually type, you switch to INSERT mode. `i` inserts before the cursor, `a` after it, `I`/`A` at the start/end of the line, and `o`/`O` open a new line below/above. In real Vim these differ by cursor placement; in this trainer they all mean the same thing — 'start typing now' — and you leave insert mode with `esc`. The core habit to build: you cannot just type into a fresh Vim buffer; you press `i` first.",
    examples: [
      "i        # enter insert mode, then type your text",
      "o        # open a new line below and start typing",
      "i → type your lines → esc   # the fundamental editing loop",
    ],
    seeAlso: ["esc", ":w", "dd"],
  },

  esc: {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "The Escape key, the single most-pressed key in Vim. It is an editor mode switch typed inside nvim, not a shell command.",
    synopsis: "esc",
    explanation:
      "`esc` leaves INSERT mode and returns to NORMAL mode, where commands like `:w`, `dd`, and `/` work again. This is the move beginners forget: ex commands (anything starting with `:`) and normal-mode verbs only work from NORMAL mode, so if a `:w` seems to be 'typed as text' instead of running, you are still in insert mode and need `esc` first. A good reflex is to tap `esc` whenever you are unsure which mode you are in — from normal mode it harmlessly does nothing.",
    examples: [
      "esc          # finish typing, return to NORMAL mode",
      "i → hello → esc → :w   # type, leave insert, then save",
    ],
    seeAlso: ["i", ":w", ":wq"],
  },

  ":w": {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "An ex command (the `:` command line) inside nvim — short for `:write`. Typed in the editor from NORMAL mode, not at the shell.",
    synopsis: ":w",
    explanation:
      "`:w` writes (saves) the current buffer to its file on disk. It does not quit — you stay in the editor and can keep working. Saving clears the 'unsaved changes' state, which matters because `:q` refuses to quit while changes are unsaved. The rhythm to internalize: make edits, `esc` back to normal mode, `:w` to save, then `:q` to leave (or do both at once with `:wq`).",
    examples: [
      ":w           # save changes, keep editing",
      "esc → :w     # leave insert mode, then save",
    ],
    seeAlso: [":wq", ":q", "esc"],
  },

  ":q": {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "An ex command inside nvim — short for `:quit`. Typed from NORMAL mode in the editor, not at the shell prompt.",
    synopsis: ":q",
    explanation:
      "`:q` quits the editor — but ONLY if there are no unsaved changes. If you have edited the buffer without saving, Vim blocks the quit with an error (E37: No write since last change) to stop you losing work. Your two ways out: save first with `:w` (then `:q`) or in one step `:wq`, OR throw the changes away with `:q!`. This guardrail is the thing that traps new users in Vim; once you know `:wq` saves-and-quits and `:q!` discards-and-quits, you are never stuck.",
    examples: [
      ":q           # quit (only works with no unsaved changes)",
      ":w → :q      # save first, then quit cleanly",
    ],
    seeAlso: [":q!", ":wq", ":w"],
  },

  ":q!": {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "An ex command inside nvim — `:quit` with a `!` that forces it. Typed from NORMAL mode in the editor.",
    synopsis: ":q!",
    explanation:
      "`:q!` quits and throws away any unsaved changes. The `!` means 'force, I know what I am doing' — it overrides the safety check that makes a plain `:q` refuse to quit with unsaved edits. Reach for it when you have made a mess and want to bail out, returning the file to its last-saved state. If instead you want to KEEP your edits, use `:wq` (save then quit), not `:q!`.",
    examples: [
      ":q!          # quit and discard all unsaved changes",
      "esc → :q!    # bail out of a bad edit without saving",
    ],
    seeAlso: [":q", ":wq", ":w"],
  },

  ":wq": {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "An ex command inside nvim that chains `:w` then `:q` (`:x` is an equivalent). Typed from NORMAL mode in the editor.",
    synopsis: ":wq   (also :x)",
    explanation:
      "`:wq` saves the buffer and then quits, in one command — the everyday 'I'm done, keep my work' exit. It is `:w` plus `:q` combined, so it never hits the unsaved-changes guard. Use `:wq` when you want to keep your edits, and `:q!` when you want to discard them. `:x` does the same thing as `:wq`.",
    examples: [
      ":wq          # save and quit — the normal way to finish",
      "esc → :wq    # leave insert mode, then save and exit",
    ],
    seeAlso: [":w", ":q", ":q!"],
  },

  dd: {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "A normal-mode verb typed inside nvim — `d` (delete) doubled to act on the whole current line. Not a shell command.",
    synopsis: "dd",
    explanation:
      "`dd` deletes the entire line the cursor is on and closes the gap, shifting the lines below up. It is the fast way to remove a whole line without entering insert mode and backspacing. In Vim the deleted line is also yanked (cut) so it can be pasted with `p`; this trainer focuses on the delete itself. Combine it with `gg`/`G` and `/` to navigate to the right line first, then `dd` to remove it.",
    examples: [
      "dd           # delete the current line",
      "/TODO → dd   # jump to a line, then delete it",
    ],
    seeAlso: ["gg", "G", "i"],
  },

  gg: {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "A normal-mode motion typed inside nvim — `g` doubled to jump to the top. Not a shell command.",
    synopsis: "gg",
    explanation:
      "`gg` moves the cursor to the first line of the file. It is the counterpart of `G` (last line), and together they are how you leap to the ends of a buffer without scrolling. Use `gg` to get to the top before inserting a header, or as the starting point for a search.",
    examples: [
      "gg           # jump to the first line",
      "gg → i       # go to the top, then start typing a header",
    ],
    seeAlso: ["G", "/", "dd"],
  },

  G: {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "A normal-mode motion typed inside nvim — capital `G` jumps to the bottom. Not a shell command.",
    synopsis: "G",
    explanation:
      "`G` moves the cursor to the last line of the file — the mirror image of `gg`. It is the quick way to get to the end of a buffer, for example before opening a new line with `o` to append content. Note it is capital `G`; lowercase has other meanings in Vim.",
    examples: [
      "G            # jump to the last line",
      "G → o        # go to the bottom, then open a new line below",
    ],
    seeAlso: ["gg", "dd", "i"],
  },

  "/": {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "A normal-mode search typed inside nvim — `/` opens the forward-search prompt. Typed in the editor, not at the shell.",
    synopsis: "/pattern",
    explanation:
      "`/text` searches the buffer for `text` and moves the cursor to the next match, wrapping around to the top if needed. It is how you navigate by content instead of by line number — type `/` immediately followed by what you are looking for. In this trainer the match is recorded only when something is actually found, so an empty or unmatched search does not count. Once on a match, you can act on it, e.g. `dd` to delete that line.",
    examples: [
      "/error       # jump to the next line containing 'error'",
      "/TODO → dd   # find a TODO line, then delete it",
    ],
    seeAlso: [":%s", "gg", "G"],
  },

  ":%s": {
    kind: "editor-command",
    environment: ["nvim"],
    provenance:
      "An ex command inside nvim — `:substitute` with the `%` range meaning 'every line'. Typed from NORMAL mode in the editor.",
    synopsis: ":%s/old/new/g",
    explanation:
      "`:%s/old/new/g` is find-and-replace across the whole file. Read it in pieces: `%` is the range 'all lines', `s` is substitute, `old` is the text to find, `new` is the replacement, and the trailing `g` means 'every occurrence on each line' (without `g` it changes only the first match per line). Drop the `%` (just `:s/old/new/`) to act on the current line only. This is the power tool for renaming a variable or fixing a repeated typo in one shot.",
    examples: [
      ":%s/foo/bar/g    # replace every 'foo' with 'bar' in the file",
      ":%s/  / /g       # collapse double spaces to single, everywhere",
      ":s/old/new/      # replace only the first 'old' on the current line",
    ],
    seeAlso: ["/", "dd"],
  },
};
