import type { Lesson } from "../lessons/types.ts";

/**
 * Lesson cards for the core shell commands and the engine's own meta-commands.
 *
 * The whole point of this file is honesty about *what kind of thing* each command
 * is: a shell builtin, a classic Unix coreutil, a standalone program you install,
 * or a Terminal Invaders game command. Beginners routinely can't tell `rg` (a
 * separate program) from `cd` (built into the shell), so every `provenance` answers
 * "what is this and where does it come from", and every `explanation` is plain
 * English you could hand to someone on day one.
 */
export const CORE_COMMAND_LESSONS: Record<string, Lesson> = {
  pwd: {
    kind: "shell-builtin",
    environment: ["bash", "zsh"],
    provenance:
      "A shell builtin — `pwd` (\"print working directory\") is part of bash/zsh itself, not a separate program, so there is nothing to install; it ships with the shell.",
    synopsis: "pwd",
    explanation:
      "Prints the absolute path of the directory you are currently \"standing in\". The shell always has a notion of a current directory, and `pwd` is how you ask it where that is. Reach for it whenever you've lost track of where commands like `ls` or `cat` will look.",
    examples: ["pwd", "pwd   # e.g. /home/you/projects/terminal-invaders"],
    seeAlso: ["cd", "ls"],
  },

  ls: {
    kind: "coreutil",
    environment: ["bash", "zsh"],
    provenance:
      "A classic Unix coreutil — `ls` is a small standalone program (part of GNU coreutils / BSD), preinstalled on virtually every macOS and Linux machine, so you rarely install it yourself. (PowerShell's equivalent is `Get-ChildItem`/`dir`.)",
    synopsis: "ls [options] [path]",
    explanation:
      "Lists the files and folders inside a directory — by default the one you're in. It's the command you run constantly to see what's around you before you `cd` into something or `cat` a file. Common flags: `-l` for a detailed long listing, `-a` to include hidden dotfiles.",
    examples: ["ls", "ls -la", "ls src/commands"],
    seeAlso: ["pwd", "cd", "tree", "cat"],
  },

  cd: {
    kind: "shell-builtin",
    environment: ["bash", "zsh"],
    provenance:
      "A shell builtin — `cd` (\"change directory\") must be built into the shell because it changes the shell's own current directory; an external program couldn't do that. It comes with bash/zsh, nothing to install.",
    synopsis: "cd [path]",
    explanation:
      "Moves you into a different directory, changing where subsequent commands operate. Pass a path to go there; pass nothing to jump to your home directory, `..` to go up one level, or `-` to hop back to the previous directory. This is the primary way you navigate a filesystem in a terminal.",
    examples: ["cd src", "cd ..", "cd /home/you/projects", "cd"],
    seeAlso: ["pwd", "ls"],
  },

  cat: {
    kind: "coreutil",
    environment: ["bash", "zsh"],
    provenance:
      "A classic Unix coreutil — `cat` (\"concatenate\") is a standalone program from coreutils, preinstalled on essentially all macOS/Linux systems. (A popular install-it-yourself upgrade is `bat`, which adds syntax highlighting.)",
    synopsis: "cat [file...]",
    explanation:
      "Prints the entire contents of one or more files straight to the terminal. It's the quickest way to glance at a small text file without opening an editor. Its name comes from \"concatenate\": give it several files and it streams them out one after another.",
    examples: ["cat README.md", "cat package.json", "cat a.txt b.txt"],
    seeAlso: ["open", "ls", "rg", "nvim"],
  },

  open: {
    kind: "coreutil",
    environment: ["bash", "zsh"],
    provenance:
      "In Terminal Invaders this is a simulated command: `open` shows a file in the trainer's preview pane. On real macOS, `open <file>` launches the file in its default application; the Linux analog is `xdg-open`.",
    synopsis: "open <file>",
    explanation:
      "In this trainer, `open` previews a file in the side pane so you can read it without leaving the mission — think of it as \"take a look at this\". On a real Mac, `open` hands a file to whatever app is registered for it (a PDF to Preview, a folder to Finder); on Linux you'd use `xdg-open` for the same effect. Use it here when a mission tells you to inspect a file.",
    examples: ["open README.md", "open notes.txt"],
    seeAlso: ["cat", "ls"],
  },

  rg: {
    kind: "external-cli",
    environment: ["bash", "zsh"],
    provenance:
      "ripgrep — a standalone search tool you install yourself. It is NOT bash, NOT a shell builtin, and NOT a PowerShell cmdlet; it's a separate program. Install: `brew install ripgrep`, `apt install ripgrep`, or `winget install BurntSushi.ripgrep.MSVC`.",
    synopsis: "rg <pattern> [path]",
    explanation:
      "Searches the text of files for a pattern and prints every matching line with its file name and line number. It's the modern, very fast replacement for `grep`: it recurses into subdirectories by default and automatically skips files listed in your `.gitignore`. Reach for it to answer \"where in this codebase is X?\".",
    examples: [
      "rg TODO",
      "rg \"function (\\w+)\" src",
      "rg -i error logs/",
      "rg --files-with-matches Lesson",
    ],
    seeAlso: ["cat", "ls", "nvim"],
  },

  nvim: {
    kind: "external-cli",
    environment: ["bash", "zsh", "nvim"],
    provenance:
      "Neovim — a standalone modal text editor you launch as the program `nvim`; it is not part of the shell. Install: `brew install neovim`, `apt install neovim`, or `winget install Neovim.Neovim`. Once it's running, you type editor commands (its own `nvim` language), not shell commands.",
    synopsis: "nvim [file]",
    explanation:
      "Opens the Neovim editor, optionally on a specific file. Neovim is *modal*: you start in Normal mode for moving and manipulating text, press `i` to enter Insert mode to type, and press `Esc` to return. You save and quit with `:w` and `:q`. It's the editor this trainer drills for muscle memory.",
    examples: ["nvim", "nvim README.md", "nvim src/index.ts"],
    seeAlso: ["cat", "open", "rg"],
  },

  git: {
    kind: "external-cli",
    environment: ["bash", "zsh", "tool:git"],
    provenance:
      "Git — the standalone version-control program you run as `git`. It's not built into the shell. Install: `brew install git`, `apt install git`, or `winget install Git.Git`. You drive it through subcommands (`git status`, `git commit`, ...), each taught on its own card.",
    synopsis: "git <subcommand> [args]",
    explanation:
      "Git tracks the history of your project so you can record snapshots (commits), branch off to try things, and undo mistakes. The bare `git` is just the entry point — the real work happens in subcommands like `status` (what changed), `add` (stage changes), `commit` (record a snapshot), and `checkout`/`switch` (move between branches or restore files). Run `git <subcommand> --help` for any of them.",
    examples: ["git status", "git add .", "git commit -m \"message\"", "git log --oneline"],
    seeAlso: ["rg", "nvim"],
  },

  tree: {
    kind: "coreutil",
    environment: ["bash", "zsh"],
    provenance:
      "A small Unix program that draws directory trees. Unlike `ls` it is frequently NOT preinstalled, so you usually add it yourself: `brew install tree`, `apt install tree`, or `winget install gnuwin32.tree`.",
    synopsis: "tree [options] [path]",
    explanation:
      "Displays a directory and everything inside it as an indented, branching tree, so you can see the whole structure at a glance instead of running `ls` folder by folder. Use `-L <n>` to limit how deep it goes and `-a` to include hidden files. Great for getting your bearings in an unfamiliar project.",
    examples: ["tree", "tree -L 2", "tree -a src"],
    seeAlso: ["ls", "cd"],
  },

  check: {
    kind: "shell-builtin",
    environment: ["bash"],
    provenance:
      "This is a Terminal Invaders game command, not a real shell command — the engine provides it to score your progress.",
    synopsis: "check",
    explanation:
      "Validates the current mission: it inspects the state you've produced and tells you whether you've met the objective. Run it when you think you're done to confirm — and to bank your score for the mission.",
    examples: ["check"],
    seeAlso: ["hint", "reset", "help"],
  },

  hint: {
    kind: "shell-builtin",
    environment: ["bash"],
    provenance:
      "This is a Terminal Invaders game command, not a real shell command — the engine provides it to nudge you when you're stuck.",
    synopsis: "hint",
    explanation:
      "Reveals the next hint for the current mission. Hints cost points, so lean on the mission briefing and `explain` first and use `hint` only when you're genuinely stuck.",
    examples: ["hint"],
    seeAlso: ["explain", "check", "help"],
  },

  help: {
    kind: "shell-builtin",
    environment: ["bash"],
    provenance:
      "This is a Terminal Invaders game command, not a real shell command — the engine provides it to list what you can type.",
    synopsis: "help",
    explanation:
      "Lists the commands available to you right now, each with a one-line summary. It's your map when you're not sure what you're allowed to do; pair it with `explain <name>` to dig into any single command.",
    examples: ["help"],
    seeAlso: ["explain", "hint", "check"],
  },

  explain: {
    kind: "shell-builtin",
    environment: ["bash"],
    provenance:
      "This is a Terminal Invaders game command, not a real shell command — the engine provides it to surface the lesson cards in this very file.",
    synopsis: "explain <name>",
    explanation:
      "Shows the full lesson card for a command: what kind of thing it is, where it comes from, what it does, and runnable examples. This is the command that answers \"wait, is `rg` even bash?\". Run `explain rg` (or any command name) before reaching for a hint.",
    examples: ["explain rg", "explain git", "explain nvim"],
    seeAlso: ["help", "hint"],
  },

  clear: {
    kind: "shell-builtin",
    environment: ["bash"],
    provenance:
      "This is a Terminal Invaders game command, not a real shell command — though a real shell also has a `clear` program that does the same thing.",
    synopsis: "clear",
    explanation:
      "Clears the terminal screen, scrolling old output away so you have a clean slate. It only affects what's displayed — it does not change your files, your progress, or the mission state.",
    examples: ["clear"],
    seeAlso: ["reset", "help"],
  },

  reset: {
    kind: "shell-builtin",
    environment: ["bash"],
    provenance:
      "This is a Terminal Invaders game command, not a real shell command — the engine provides it to start the current mission over.",
    synopsis: "reset",
    explanation:
      "Restarts the current mission, returning the simulated filesystem and any changes you made back to their starting state so you can attempt it fresh. Unlike `clear`, which only wipes the screen, `reset` rewinds the actual mission. Use it after a messy attempt.",
    examples: ["reset"],
    seeAlso: ["clear", "check", "hint"],
  },
};
