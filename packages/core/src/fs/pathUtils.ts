/** POSIX-ish path helpers for the virtual filesystem. All paths are absolute. */

/** Resolve `input` (absolute or relative, with `.`/`..`) against `cwd`. */
export function resolvePath(cwd: string, input: string): string {
  if (!input || input === ".") return normalizePath(cwd);
  const base = input.startsWith("/") ? "/" : cwd;
  const stack: string[] = [];
  for (const seg of `${base}/${input}`.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      stack.pop();
      continue;
    }
    stack.push(seg);
  }
  return "/" + stack.join("/");
}

export function normalizePath(path: string): string {
  return resolvePath("/", path);
}

/** Parent directory of a path, or null for the root. */
export function parentPath(path: string): string | null {
  const norm = normalizePath(path);
  if (norm === "/") return null;
  const idx = norm.lastIndexOf("/");
  return idx <= 0 ? "/" : norm.slice(0, idx);
}

/** Final segment of a path (e.g. "/project/src" -> "src"). */
export function basename(path: string): string {
  const norm = normalizePath(path);
  if (norm === "/") return "/";
  return norm.slice(norm.lastIndexOf("/") + 1);
}

/** Split a partial path token into its directory part and the trailing fragment. */
export function splitForCompletion(token: string): { dir: string; fragment: string } {
  const idx = token.lastIndexOf("/");
  if (idx === -1) return { dir: "", fragment: token };
  return { dir: token.slice(0, idx + 1), fragment: token.slice(idx + 1) };
}
