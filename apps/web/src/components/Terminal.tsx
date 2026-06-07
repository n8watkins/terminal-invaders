import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { completeInput, type GameEngine } from "@terminal-invaders/core";
import type { OutputLine } from "../lib/output.ts";

type Props = {
  engine: GameEngine;
  lines: OutputLine[];
  onRun: (input: string) => void;
};

export function Terminal({ engine, lines, onRun }: Props) {
  const [value, setValue] = useState("");
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [hint, setHint] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines, hint]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const promptLabel = engine.editorOpen ? `nvim:${engine.editorStatusLine() ?? ""}` : `${engine.state.cwd} $`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const history = engine.state.commandHistory;
    if (e.key === "Enter") {
      onRun(value);
      setValue("");
      setHistIdx(null);
      setHint([]);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (engine.editorOpen) return;
      const res = completeInput(value, engine);
      if (res.completed) {
        engine.noteAutocompleteUsed();
        setValue(res.replacement);
        setHint([]);
      } else if (res.options.length > 1) {
        setHint(res.options);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setValue(history[idx] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(null);
        setValue("");
      } else {
        setHistIdx(idx);
        setValue(history[idx] ?? "");
      }
    }
  };

  return (
    <div className="panel terminal" onClick={() => inputRef.current?.focus()}>
      <div className="panel-title">Terminal</div>
      <div className="log" ref={logRef}>
        {lines.map((l) => (
          <div key={l.id} className={`log-line ${l.kind}`}>
            {l.kind === "input" ? <span className="log-prompt">$ </span> : null}
            {l.text}
          </div>
        ))}
        {hint.length > 1 ? <div className="log-line system">{hint.join("   ")}</div> : null}
      </div>
      <div className="input-row">
        <span className={`prompt ${engine.editorOpen ? "editor" : ""}`}>{promptLabel}</span>
        <input
          ref={inputRef}
          className="cmd-input"
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
