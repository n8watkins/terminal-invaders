const enabled = process.stdout.isTTY && process.env.NO_COLOR === undefined;

const wrap = (code: number) => (s: string) =>
  enabled ? `\x1b[${code}m${s}\x1b[0m` : s;

export const c = {
  bold: wrap(1),
  dim: wrap(2),
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  blue: wrap(34),
  magenta: wrap(35),
  cyan: wrap(36),
  gray: wrap(90),
};
