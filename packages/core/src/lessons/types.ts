/**
 * Lesson layer — the "what IS this command" teaching metadata.
 *
 * The original product taught commands implicitly: a one-line `summary` in `help`
 * and whatever a mission's briefing/hints said. That left the most basic question
 * unanswered — *what kind of thing is `rg`? is it part of the shell? is it bash or
 * PowerShell? where does it come from?* A `Lesson` answers exactly that, and is
 * attached to commands, editor verbs, and git subcommands alike so `explain <name>`
 * and a richer `help` can surface it.
 */

/**
 * Which shell/tool world a command belongs to. A trainer for *muscle memory* has
 * to be honest about this: `ls` is a Unix shell convention, `Get-ChildItem` is its
 * PowerShell equivalent, `rg` is a standalone program you install. Tagging the
 * environment lets one engine host bash, PowerShell, nvim, and tool-specific
 * tracks without pretending they're the same vocabulary.
 */
export type Environment =
  | "bash" // a POSIX-ish shell (we model bash/zsh-style usage)
  | "zsh"
  | "powershell"
  | "nvim" // the editor's own command language
  | "tool:git" // git's subcommand world
  | "tool:fzf"; // fuzzy-finder interaction

/**
 * The *category* of a command — the thing players are actually confused about.
 * "Is this built into my shell, a classic Unix program, or something I install?"
 */
export type CommandKind =
  | "shell-builtin" // part of the shell itself (cd, pwd) — no separate program
  | "coreutil" // a classic Unix program, preinstalled almost everywhere (ls, cat)
  | "external-cli" // a standalone program you install (rg, fzf, bat, eza, jq)
  | "editor-command" // a verb inside the editor (i, :w, dd, :%s)
  | "git-subcommand" // a subcommand of git (status, add, commit)
  | "powershell-cmdlet"; // a PowerShell cmdlet (Get-ChildItem, Select-String)

/**
 * The teaching card for one command/verb/subcommand. Optional on a `CommandSpec`
 * so it can be filled incrementally, but the goal is full coverage — and a test
 * enforces it for the core vocabulary.
 */
export type Lesson = {
  kind: CommandKind;
  /** Which environment(s) this belongs to. */
  environment: Environment[];
  /**
   * Where it comes from, in one honest sentence — including how you'd get it on a
   * real machine. e.g. "ripgrep — a standalone search tool you install, not a
   * shell builtin. Install: `brew install ripgrep` (or `apt install ripgrep`)."
   */
  provenance: string;
  /** Usage shape, e.g. "rg <pattern> [path]". */
  synopsis: string;
  /** A plain-language paragraph: what it does and when you'd reach for it. */
  explanation: string;
  /** Concrete examples a player can read and immediately try. */
  examples: string[];
  /** Related commands worth knowing next. */
  seeAlso?: string[];
};
