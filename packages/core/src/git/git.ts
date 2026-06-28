import type { VirtualFs } from "../fs/virtualFs.ts";

/**
 * A teaching-grade git simulation: three trees — HEAD (last commit), the index
 * (staging area), and the working tree (the live VirtualFs). Enough to practice
 * status → diff → add → restore → commit and, crucially, *recovering* safely.
 */
export type GitCommit = { sha: string; message: string; at: number };

export type GitStatus = {
  staged: { path: string; kind: "modified" | "added" | "deleted" }[];
  modified: { path: string; kind: "modified" | "deleted" }[];
  untracked: string[];
};

/** Serializable snapshot of the three trees — for carrying git state across a journey. */
export type GitSnapshot = {
  head: Record<string, string>;
  index: Record<string, string>;
  commits: GitCommit[];
};

export class GitModel {
  private head: Map<string, string>;
  private index: Map<string, string>;
  readonly commits: GitCommit[] = [];

  constructor(headSnapshot: Record<string, string>) {
    this.head = new Map(Object.entries(headSnapshot));
    this.index = new Map(this.head);
  }

  /** Capture all three trees so the world can be saved and resumed later. */
  snapshot(): GitSnapshot {
    return {
      head: Object.fromEntries(this.head),
      index: Object.fromEntries(this.index),
      commits: this.commits.map((c) => ({ ...c })),
    };
  }

  /** Overwrite this model's three trees from a snapshot (in place). */
  loadSnapshot(snap: GitSnapshot): void {
    this.head = new Map(Object.entries(snap.head));
    this.index = new Map(Object.entries(snap.index));
    this.commits.length = 0;
    this.commits.push(...snap.commits.map((c) => ({ ...c })));
  }

  static fromSnapshot(snap: GitSnapshot): GitModel {
    const g = new GitModel(snap.head);
    g.loadSnapshot(snap);
    return g;
  }

  /**
   * Inject a commit straight into history — simulating a change that "already
   * landed" (a teammate's commit, an upstream pull). Sets head + index for the
   * given files and records a commit, leaving the working tree to the caller.
   */
  injectCommit(message: string, files: Record<string, string>): GitCommit {
    for (const [path, content] of Object.entries(files)) {
      this.head.set(path, content);
      this.index.set(path, content);
    }
    const sha = shortSha();
    const commit: GitCommit = { sha, message, at: Date.now() };
    this.commits.push(commit);
    return commit;
  }

  private tracked(): Set<string> {
    return new Set([...this.head.keys(), ...this.index.keys()]);
  }

  status(fs: VirtualFs): GitStatus {
    const staged: GitStatus["staged"] = [];
    const modified: GitStatus["modified"] = [];
    const untracked: string[] = [];

    for (const path of this.tracked()) {
      const head = this.head.get(path);
      const index = this.index.get(path);
      const work = fs.readFile(path);

      if (index !== head) {
        if (head === undefined) staged.push({ path, kind: "added" });
        else if (index === undefined) staged.push({ path, kind: "deleted" });
        else staged.push({ path, kind: "modified" });
      }
      if (work !== index) {
        if (work === undefined) modified.push({ path, kind: "deleted" });
        else modified.push({ path, kind: "modified" });
      }
    }

    // Untracked: files that exist in the working tree but git has never seen.
    for (const path of fs.allPaths()) {
      if (!fs.isFile(path)) continue;
      if (!this.head.has(path) && !this.index.has(path)) untracked.push(path);
    }

    return { staged, modified, untracked };
  }

  /** Paths with staged changes (index differs from HEAD). */
  stagedPaths(): string[] {
    const out: string[] = [];
    for (const path of this.tracked()) {
      if (this.index.get(path) !== this.head.get(path)) out.push(path);
    }
    return out;
  }

  /** Paths with unstaged or untracked changes. */
  modifiedPaths(fs: VirtualFs): string[] {
    const s = this.status(fs);
    return [...s.modified.map((m) => m.path), ...s.untracked];
  }

  diff(fs: VirtualFs, staged: boolean): string[] {
    const lines: string[] = [];
    for (const path of this.tracked()) {
      const from = staged ? this.head.get(path) : this.index.get(path);
      const to = staged ? this.index.get(path) : fs.readFile(path);
      if (from === to) continue;
      lines.push(`diff --git a${path} b${path}`);
      lines.push(...lineDiff(from ?? "", to ?? ""));
    }
    return lines.length ? lines : ["(no changes)"];
  }

  add(fs: VirtualFs, path: string): { ok: boolean; message: string } {
    const work = fs.readFile(path);
    if (work === undefined && !this.tracked().has(path)) {
      return { ok: false, message: `fatal: pathspec '${path}' did not match any files` };
    }
    if (work === undefined) this.index.delete(path);
    else this.index.set(path, work);
    return { ok: true, message: "" };
  }

  /** Restore the working tree from the index (default) or unstage with --staged. */
  restore(fs: VirtualFs, path: string, staged: boolean): { ok: boolean; message: string } {
    if (staged) {
      const head = this.head.get(path);
      if (head === undefined) this.index.delete(path);
      else this.index.set(path, head);
      return { ok: true, message: `Unstaged ${path}` };
    }
    const source = this.index.get(path);
    if (source === undefined) {
      return { ok: false, message: `error: pathspec '${path}' did not match any file(s) known to git` };
    }
    fs.writeFile(path, source);
    return { ok: true, message: `Restored ${path}` };
  }

  commit(message: string): { ok: boolean; message: string } {
    if (this.stagedPaths().length === 0) {
      return { ok: false, message: "nothing to commit (use `git add` first)" };
    }
    this.head = new Map(this.index);
    const sha = shortSha();
    this.commits.push({ sha, message, at: Date.now() });
    return { ok: true, message: `[main ${sha}] ${message}` };
  }

  log(): string[] {
    if (this.commits.length === 0) return ["(no commits yet)"];
    return this.commits
      .slice()
      .reverse()
      .map((c) => `${c.sha} ${c.message}`);
  }
}

/**
 * An LCS-based line diff. We find the longest common subsequence of lines and
 * emit only the lines that truly changed: `-` for lines removed from `from` and
 * `+` for lines added in `to`, with shared lines suppressed. Unlike a positional
 * compare, inserting or removing a single line no longer marks everything after
 * it as changed. Same output shape callers rely on: a flat string[] of `-`/`+`
 * lines (no header — the header is added by diff()).
 */
function lineDiff(from: string, to: string): string[] {
  // An empty side means the file was added (from="") or deleted (to=""), which
  // has zero lines — not one blank line. "".split("\n") would yield [""] and
  // emit a phantom -/+ blank line, so treat empty as no lines.
  const a = from === "" ? [] : from.split("\n");
  const b = to === "" ? [] : to.split("\n");
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = length of the LCS of a[i..] and b[j..]. Build it bottom-up so we
  // can then walk top-down to recover the alignment that maximizes shared lines.
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      // Shared line — suppress it.
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push(`-${a[i]}`);
      i++;
    } else {
      out.push(`+${b[j]}`);
      j++;
    }
  }
  while (i < n) out.push(`-${a[i++]}`);
  while (j < m) out.push(`+${b[j++]}`);
  return out;
}

function shortSha(): string {
  return Math.random().toString(16).slice(2, 9);
}
