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

export class GitModel {
  private head: Map<string, string>;
  private index: Map<string, string>;
  readonly commits: GitCommit[] = [];

  constructor(headSnapshot: Record<string, string>) {
    this.head = new Map(Object.entries(headSnapshot));
    this.index = new Map(this.head);
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

function lineDiff(from: string, to: string): string[] {
  const a = from.split("\n");
  const b = to.split("\n");
  const out: string[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] === b[i]) continue;
    if (a[i] !== undefined) out.push(`-${a[i]}`);
    if (b[i] !== undefined) out.push(`+${b[i]}`);
  }
  return out;
}

function shortSha(): string {
  return Math.random().toString(16).slice(2, 9);
}
