import type { Lesson } from "../lessons/types.ts";

/**
 * Teaching cards for the git subcommands this trainer simulates.
 *
 * These are subcommands of the `git` program — you run them as `git <subcommand>`
 * (e.g. `git status`). Git is a separate program you install (e.g. `apt install git`,
 * `brew install git`), not a shell builtin.
 *
 * The mental model that ties them together is git's three trees:
 *   working tree  → (git add) →  staging area / index  → (git commit) →  history
 * Your live files are the working tree. `add` stages a snapshot into the index;
 * `commit` records the index permanently into history. `status` and `diff` show you
 * where things stand between those trees, and `log` shows the history you've built.
 */
export const GIT_LESSONS: Record<string, Lesson> = {
  status: {
    kind: "git-subcommand",
    environment: ["tool:git"],
    provenance:
      "A subcommand of the `git` program: `git status`. Git is installed separately (e.g. `apt install git` / `brew install git`).",
    synopsis: "git status",
    explanation:
      "`git status` is your dashboard: it tells you which files have changed and, crucially, which of git's three trees those changes live in. It lists changes staged for the next commit (already `add`ed to the index), changes in the working tree that are not staged yet, and untracked files git has never seen. Run it constantly — before and after `add`, `commit`, and `restore` — to confirm git's state matches your intent. It only reports; it changes nothing.",
    examples: [
      "git status       # see staged, unstaged, and untracked changes",
      "git status       # run it again after `git add` to confirm staging",
    ],
    seeAlso: ["diff", "add", "log"],
  },

  diff: {
    kind: "git-subcommand",
    environment: ["tool:git"],
    provenance:
      "A subcommand of the `git` program: `git diff`. Part of git, which you install separately.",
    synopsis: "git diff [--staged]",
    explanation:
      "`git diff` shows the actual line-by-line changes, where `status` only names the files. By default it shows unstaged changes — the difference between your working tree and the index — i.e. edits you have NOT yet `add`ed. With `--staged` (also written `--cached`) it shows what is staged — the difference between the index and the last commit — i.e. exactly what a `commit` would record. Use it to review your work before staging and before committing, so you never commit a stray change.",
    examples: [
      "git diff             # unstaged changes (working tree vs. index)",
      "git diff --staged    # staged changes (what `git commit` will record)",
    ],
    seeAlso: ["status", "add", "commit"],
  },

  add: {
    kind: "git-subcommand",
    environment: ["tool:git"],
    provenance:
      "A subcommand of the `git` program: `git add`. Part of git, which you install separately.",
    synopsis: "git add <file>",
    explanation:
      "`git add` stages changes: it copies the current state of a file into the staging area (the index), marking it to be included in the next commit. This is the first of git's two-step save — `add` chooses WHAT goes in the snapshot, then `commit` records it. Staging lets you build a commit deliberately, including only the files you mean to. To undo a stage without touching the file's contents, use `git restore --staged <file>`.",
    examples: [
      "git add notes.txt    # stage one file for the next commit",
      "git add .            # stage all changes in the current directory",
      "git status           # verify what is now staged",
    ],
    seeAlso: ["status", "restore", "commit"],
  },

  restore: {
    kind: "git-subcommand",
    environment: ["tool:git"],
    provenance:
      "A subcommand of the `git` program: `git restore` (introduced in git 2.23 to replace the file-related uses of `git checkout`). Part of git, which you install separately.",
    synopsis: "git restore [--staged] <file>",
    explanation:
      "`git restore` is the modern, single-purpose 'undo my file changes' command. `git restore <file>` discards your working-tree edits and resets the file to its staged/last-committed version — handy when an experiment went wrong (this is destructive: unsaved edits are gone). `git restore --staged <file>` does something different: it unstages a file, removing it from the index while leaving your actual edits intact. Think of plain `restore` as 'throw away my changes' and `restore --staged` as 'un-add'. This trainer simulates `restore` for discarding changes; in the wild you will also see the older `git checkout` used for the same job.",
    examples: [
      "git restore notes.txt          # discard working-tree edits to notes.txt",
      "git restore --staged notes.txt # unstage it, but keep the edits",
    ],
    seeAlso: ["checkout", "add", "status"],
  },

  commit: {
    kind: "git-subcommand",
    environment: ["tool:git"],
    provenance:
      "A subcommand of the `git` program: `git commit`. Part of git, which you install separately.",
    synopsis: 'git commit -m "message"',
    explanation:
      "`git commit` permanently records whatever is currently staged in the index as a new snapshot in the project's history, with a message describing the change. It is the second half of git's two-step save: `add` picks what goes in, `commit` writes it down. Only staged changes are committed — anything you edited but did not `add` is left out — so it pays to run `git status` or `git diff --staged` first. Each commit becomes a point you can later inspect with `log` and return to.",
    examples: [
      'git commit -m "Add project notes"   # record the staged snapshot',
      "git add . && git commit -m \"...\"     # stage everything, then commit",
    ],
    seeAlso: ["add", "status", "log"],
  },

  log: {
    kind: "git-subcommand",
    environment: ["tool:git"],
    provenance:
      "A subcommand of the `git` program: `git log`. Part of git, which you install separately.",
    synopsis: "git log",
    explanation:
      "`git log` shows the history — the list of commits you have made, newest first, each with its short id (SHA) and message. It is how you see where the project has been and find a specific past snapshot. Reading it well is what makes good commit messages worth writing. Like `status` and `diff`, it only reports; it changes nothing.",
    examples: [
      "git log          # list commits, most recent first",
      "git log          # find a commit's SHA before inspecting it",
    ],
    seeAlso: ["commit", "status", "diff"],
  },

  checkout: {
    kind: "git-subcommand",
    environment: ["tool:git"],
    provenance:
      "A subcommand of the `git` program: `git checkout` — the old, overloaded command. Part of git, which you install separately. This trainer simulates `git restore` for discarding changes, but you will meet `checkout` everywhere in the real world.",
    synopsis: "git checkout <branch>   |   git checkout -- <file>",
    explanation:
      "`git checkout` is the command everyone finds confusing, because historically it did two unrelated jobs. (1) Switch branches: `git checkout main` moves you to another branch. (2) Discard file changes: `git checkout -- <file>` throws away your working-tree edits and restores the file from the last commit — the destructive 'undo'. Cramming 'change which branch I'm on' and 'wipe my edits' into one word is exactly why beginners got burned, so modern git (2.23+) split it into two clearer commands: `git switch` for branches and `git restore` for files. You do not need `checkout` anymore, but you will see it in older tutorials and other people's habits — now you know the `-- <file>` form means the same thing as `git restore <file>`.",
    examples: [
      "git checkout -- notes.txt   # OLD way to discard edits → prefer: git restore notes.txt",
      "git checkout main           # OLD way to switch branches → prefer: git switch main",
    ],
    seeAlso: ["restore", "status", "log"],
  },
};
