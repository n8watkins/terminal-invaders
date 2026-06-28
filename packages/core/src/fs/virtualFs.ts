import type { FsNode } from "../missions/types.ts";
import { basename, normalizePath, parentPath } from "./pathUtils.ts";

export type SearchMatch = { path: string; line: number; text: string };

export type DirEntry = { name: string; path: string; node: FsNode };

/**
 * In-memory virtual filesystem backed by a flat path->node map.
 * Directory listings are derived from the keys, so authoring a mission is just
 * listing the nodes you want to exist.
 */
export class VirtualFs {
  private nodes: Record<string, FsNode>;

  constructor(nodes: Record<string, FsNode>) {
    // Clone so each mission run gets a fresh, mutable tree.
    this.nodes = structuredClone(nodes);
  }

  getNode(path: string): FsNode | undefined {
    return this.nodes[normalizePath(path)];
  }

  exists(path: string): boolean {
    return this.getNode(path) !== undefined;
  }

  isDir(path: string): boolean {
    return this.getNode(path)?.type === "dir";
  }

  isFile(path: string): boolean {
    return this.getNode(path)?.type === "file";
  }

  readFile(path: string): string | undefined {
    const node = this.getNode(path);
    return node?.type === "file" ? node.content ?? "" : undefined;
  }

  writeFile(path: string, content: string): boolean {
    const norm = normalizePath(path);
    const node = this.nodes[norm];
    if (!node || node.type !== "file") return false;
    node.content = content;
    return true;
  }

  /** Immediate children of a directory, sorted dirs-first then alphabetically. */
  listDir(path: string): DirEntry[] {
    const norm = normalizePath(path);
    if (!this.isDir(norm)) return [];
    const entries: DirEntry[] = [];
    for (const [p, node] of Object.entries(this.nodes)) {
      if (parentPath(p) === norm) {
        entries.push({ name: basename(p), path: p, node });
      }
    }
    return entries.sort((a, b) => {
      if (a.node.type !== b.node.type) return a.node.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  /** Case-insensitive substring search across all file contents. */
  search(query: string): SearchMatch[] {
    const needle = query.toLowerCase();
    if (!needle) return [];
    const matches: SearchMatch[] = [];
    for (const [path, node] of Object.entries(this.nodes)) {
      if (node.type !== "file" || node.content === undefined) continue;
      node.content.split("\n").forEach((line, i) => {
        if (line.toLowerCase().includes(needle)) {
          matches.push({ path, line: i + 1, text: line.trim() });
        }
      });
    }
    return matches.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  }

  /** All file/dir paths (used for the `tree` command and debugging). */
  allPaths(): string[] {
    return Object.keys(this.nodes).sort();
  }

  /** Deep clone of the current node map — a serializable snapshot of the world. */
  toNodes(): Record<string, FsNode> {
    return structuredClone(this.nodes);
  }

  /**
   * Create or overwrite a file node (unlike `writeFile`, which only updates an
   * existing file). Used by journey world-mutations to drop new files into the
   * shared world, e.g. "a teammate's change appeared".
   */
  setFile(path: string, content: string): void {
    const norm = normalizePath(path);
    const node = this.nodes[norm];
    if (node && node.type === "file") node.content = content;
    else this.nodes[norm] = { type: "file", content };
  }

  /** Remove a node (file or dir) from the world. */
  deleteNode(path: string): void {
    delete this.nodes[normalizePath(path)];
  }
}
