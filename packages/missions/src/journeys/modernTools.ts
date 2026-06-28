import type { Journey } from "@terminal-invaders/core";

/**
 * "Modern toolbelt" — a shared-world tour of the install-it-yourself CLI tools
 * that have become many developers' daily drivers (bat, eza, zoxide, jq). One
 * small project carries across three steps: first you *look* at it with eza and
 * bat, then you *jump* into it with zoxide's `z`, then you *query* a config it
 * grew with jq. Nothing here is a coreutil — each tool is something you'd
 * `brew install` yourself — but together they make the everyday loop of "list a
 * dir, read a file, hop somewhere, pull a value out of JSON" dramatically nicer.
 *
 * The world is a tiny "acme" project: a package.json, a README, a src/app
 * source tree, and a logs dir. Step 3's setup drops a config.json into it so
 * there's real JSON to slice.
 */
const PACKAGE_JSON = '{"name":"acme","version":"1.0.0","scripts":{"dev":"vite"}}';
const README = "# acme\n\nA tiny demo project for the modern CLI toolbelt.\n";
const APP_PAGE = "export default function Page() {\n  return <h1>acme</h1>;\n}\n";
const DEV_LOG = "[12:00:01] dev server listening on http://localhost:5173\n";

export const modernToolsJourney: Journey = {
  id: "journey-modern-tools",
  title: "Modern toolbelt: bat, eza, zoxide, jq",
  environment: "bash",
  tools: ["modern"],
  blurb:
    "One small project, four modern CLI tools. List it with eza, read it with bat, teleport into it with zoxide's `z`, then pull a value out of its config with jq — the everyday upgrade to ls/cat/cd/grep, all on one evolving world.",
  outcomes: [
    "List a directory with eza and read a file with bat",
    "Jump straight to a directory by a path fragment using zoxide (`z`)",
    "Pull a single value out of a JSON file with jq",
  ],
  world: {
    startingCwd: "/proj",
    filesystem: {
      "/proj": { type: "dir" },
      "/proj/package.json": { type: "file", content: PACKAGE_JSON },
      "/proj/README.md": { type: "file", content: README },
      "/proj/src": { type: "dir" },
      "/proj/src/app": { type: "dir" },
      "/proj/src/app/page.tsx": { type: "file", content: APP_PAGE },
      "/proj/logs": { type: "dir" },
      "/proj/logs/dev.log": { type: "file", content: DEV_LOG },
    },
  },
  steps: [
    {
      id: "see-better",
      title: "Step 1 — See your project, better",
      briefing:
        "You just cloned `/proj`. Before anything else, look around with the modern equivalents of `ls` and `cat`. Run `eza` to list the directory (a colorful, type-marked `ls`), then `bat package.json` to read the manifest with line numbers and a header (a `cat` that's actually legible).",
      concepts: ["eza", "bat"],
      objectives: [
        { id: "list", label: "List the directory (eza)", type: "command_used", command: "eza" },
        { id: "open-pkg", label: "Read package.json (bat)", type: "file_opened", path: "/proj/package.json" },
        { id: "read", label: "Use bat to read a file", type: "command_used", command: "bat" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`eza` with no argument lists the current directory — like `ls`, but nicer." },
        { text: "`bat package.json` prints the file with line numbers and a header (like `cat`)." },
        { text: "Both eza and bat are tools you install yourself (`brew install eza bat`); they're not built into the shell." },
      ],
      successMessage: "That's the everyday upgrade: eza to look around, bat to actually read a file.",
    },
    {
      id: "jump",
      title: "Step 2 — Teleport with zoxide",
      briefing:
        "The app code lives down at `/proj/src/app`. Instead of `cd src/app`, use zoxide: `z app` jumps to the first directory whose path contains `app`. zoxide (invoked as `z`) is a smarter `cd` that learns your directories so a short fragment is enough to teleport.",
      concepts: ["zoxide"],
      objectives: [
        { id: "jump", label: "Jump with zoxide (z)", type: "command_used", command: "z" },
        { id: "arrived", label: "Land in /proj/src/app", type: "cwd_is", path: "/proj/src/app" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`z app` jumps to the directory whose path contains `app` — no full path needed." },
        { text: "zoxide is invoked as `z`. Here `/proj/src/app` is the only directory matching `app`, so one hop lands you there." },
      ],
      successMessage: "Teleported. With zoxide, a path fragment is usually all you need to get anywhere.",
    },
    {
      id: "query-json",
      title: "Step 3 — Query JSON with jq",
      briefing:
        "A `config.json` just landed in the project root. Rather than eyeballing it, pull the value you want with jq: `jq .port config.json` reads the file and prints just the `port`. jq is a command-line JSON processor — `.` echoes the whole document, `.key` digs into a field, `.a.b` follows a path deeper.",
      concepts: ["jq"],
      startingCwd: "/proj",
      setup: { writeFiles: { "/proj/config.json": '{"port":8080,"env":"prod"}' } },
      objectives: [
        { id: "query", label: "Read a value with jq", type: "command_used", command: "jq" },
        { id: "done", label: "Run check", type: "command_used", command: "check" },
      ],
      hints: [
        { text: "`jq .port config.json` prints just the port (`8080`)." },
        { text: "Try other filters too: `jq . config.json` for the whole doc, `jq .env config.json` for the environment." },
        { text: "jq is a standalone tool you install (`brew install jq`); it's the standard way to slice JSON from the terminal." },
      ],
      successMessage: "That's jq: point a filter at a JSON file and pull out exactly the value you need.",
    },
  ],
};
