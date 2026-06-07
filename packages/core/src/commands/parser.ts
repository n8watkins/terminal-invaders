export type ParsedCommand = {
  name: string;
  args: string[];
  raw: string;
};

/**
 * Tokenize a command line, honoring single/double quotes and collapsing
 * extra whitespace. Empty input yields an empty `name`.
 *
 *   parseCommand('rg "Start now"') -> { name: "rg", args: ["Start now"], ... }
 */
export function parseCommand(input: string): ParsedCommand {
  const raw = input;
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let hasToken = false;

  for (const ch of input.trim()) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      hasToken = true;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (hasToken) {
        tokens.push(current);
        current = "";
        hasToken = false;
      }
      continue;
    }
    current += ch;
    hasToken = true;
  }
  if (hasToken) tokens.push(current);

  const [name = "", ...args] = tokens;
  return { name, args, raw };
}
