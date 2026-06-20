/**
 * A deliberately-simplified nvim simulation for the LazyVim track.
 *
 * It is line-based (it rides on the same input loop as the shell), so it teaches
 * the *vocabulary and rhythm* — i → type → <esc> → :w → :q, search with /, and
 * substitute with :%s — rather than emulating raw keystrokes. Real keystroke
 * practice lands later in real-sandbox mode. ("Full Vim emulation" is explicitly
 * out of scope for now.)
 */
export type EditorMode = "normal" | "insert";

export type EditorStep = {
  output: string[];
  /** Engine should flush the buffer to the virtual filesystem. */
  write?: boolean;
  /** Editor should be torn down and control returned to the shell. */
  close?: boolean;
  /** Normalized verb to record for objectives (e.g. "i", ":w", ":wq", ":%s", "/"). */
  recordCommand?: string;
  /** Search pattern to record for objectives. */
  recordSearch?: string;
};

export class EditorModel {
  readonly path: string;
  lines: string[];
  mode: EditorMode = "normal";
  dirty = false;
  cursor = 0; // 0-based current line

  constructor(path: string, content: string) {
    this.path = path;
    this.lines = content.split("\n");
  }

  content(): string {
    return this.lines.join("\n");
  }

  statusLine(): string {
    const mode = this.mode === "insert" ? "-- INSERT --" : "";
    const flag = this.dirty ? "[+]" : "";
    return `${this.path} ${flag}  ${mode}`.trimEnd();
  }

  /** Process one submitted line of editor input. */
  handle(input: string): EditorStep {
    if (this.mode === "insert") return this.handleInsert(input);
    return this.handleNormal(input.trim());
  }

  private handleInsert(input: string): EditorStep {
    if (["esc", "<esc>", ":esc", "\x1b"].includes(input.trim().toLowerCase())) {
      this.mode = "normal";
      return { output: ["-- NORMAL --"], recordCommand: "esc" };
    }
    // Insert the typed line below the cursor.
    this.lines.splice(this.cursor + 1, 0, input);
    this.cursor += 1;
    this.dirty = true;
    return { output: [] };
  }

  private handleNormal(cmd: string): EditorStep {
    if (cmd === "") return { output: [] };

    // Insert-entering verbs all drop into insert mode for this simplified model.
    if (["i", "a", "I", "A", "o", "O"].includes(cmd)) {
      if (cmd === "o") {
        this.lines.splice(this.cursor + 1, 0, "");
        this.cursor += 1;
        this.dirty = true;
      }
      this.mode = "insert";
      return { output: ["-- INSERT -- (type lines; `esc` to leave)"], recordCommand: "i" };
    }

    if (cmd === "dd") {
      if (this.lines.length > 0) {
        this.lines.splice(this.cursor, 1);
        // A buffer always has at least one line (deleting the last leaves a blank),
        // and the cursor must stay a valid index — never -1.
        if (this.lines.length === 0) this.lines.push("");
        this.cursor = Math.max(0, Math.min(this.cursor, this.lines.length - 1));
        this.dirty = true;
      }
      return { output: [], recordCommand: "dd" };
    }

    if (cmd === "gg") {
      this.cursor = 0;
      return { output: [] };
    }
    if (cmd === "G") {
      this.cursor = Math.max(0, this.lines.length - 1);
      return { output: [] };
    }

    if (cmd.startsWith("/")) {
      const pattern = cmd.slice(1);
      return this.search(pattern);
    }

    // Substitute: :%s/old/new/g or :s/old/new/
    const sub = cmd.match(/^:(%?)s\/(.*?)\/(.*?)\/(g?)$/);
    if (sub) {
      return this.substitute(sub[1] === "%", sub[2] ?? "", sub[3] ?? "", sub[4] === "g");
    }

    switch (cmd) {
      case ":w":
        this.dirty = false;
        return { output: [`"${this.path}" written`], write: true, recordCommand: ":w" };
      case ":q":
        if (this.dirty) {
          return {
            output: ["E37: No write since last change (use :q! to override, or :wq to save)"],
          };
        }
        return { output: [], close: true, recordCommand: ":q" };
      case ":q!":
        return { output: [], close: true, recordCommand: ":q!" };
      case ":wq":
      case ":x":
        this.dirty = false;
        return { output: [`"${this.path}" written`], write: true, close: true, recordCommand: ":wq" };
      default:
        return { output: [`Not an editor command: ${cmd}. Try i, :w, :wq, /pattern, :%s/old/new/g`] };
    }
  }

  private search(pattern: string): EditorStep {
    if (!pattern) return { output: ["/: empty pattern"] };
    const needle = pattern.toLowerCase();
    const idx = this.lines.findIndex((l, i) => i > this.cursor && l.toLowerCase().includes(needle));
    const wrapped = idx === -1 ? this.lines.findIndex((l) => l.toLowerCase().includes(needle)) : idx;
    if (wrapped === -1) {
      // Don't record a search that matched nothing — an editor_search objective
      // should require the player to actually find the pattern.
      return { output: [`E486: Pattern not found: ${pattern}`] };
    }
    this.cursor = wrapped;
    return {
      output: [`${wrapped + 1}: ${this.lines[wrapped]}`],
      recordCommand: "/",
      recordSearch: pattern,
    };
  }

  private substitute(global: boolean, oldText: string, newText: string, allOnLine: boolean): EditorStep {
    let count = 0;
    const apply = (line: string) => {
      if (!oldText) return line;
      if (allOnLine) {
        const next = line.split(oldText).join(newText);
        if (next !== line) count += line.split(oldText).length - 1;
        return next;
      }
      if (line.includes(oldText)) {
        count += 1;
        return line.replace(oldText, newText);
      }
      return line;
    };

    if (global) {
      this.lines = this.lines.map(apply);
    } else {
      this.lines[this.cursor] = apply(this.lines[this.cursor] ?? "");
    }
    if (count > 0) this.dirty = true;
    return {
      output: [count > 0 ? `${count} substitution(s)` : `E486: Pattern not found: ${oldText}`],
      recordCommand: ":%s",
    };
  }
}
