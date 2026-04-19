# handoff

A Claude Code plugin: when Claude opens a URL in your browser for you to take an action, Handoff drops a sticky note on that page reminding you what you're supposed to do.

Powered by the Web Annotator extension.

## How it works

1. Claude Code invokes `Bash { command: "open https://..." }` or `WebFetch`.
2. A PreToolUse hook reads the transcript, finds the `TASK: <sentence>` line Claude wrote immediately before the tool call, and POSTs it to `ann serve` on `localhost:7717`.
3. You arrive on the page. The Web Annotator extension's content script asks the local queue, finds a pending note for this URL, and drops it as a sticky note — centered near the top of the viewport.

If the extension or `ann serve` is not running, the plugin silently does nothing. It will not block or slow your tool calls.

## Install

Prerequisites:
- Node 18+ (for the hook runtime)
- [`tsx`](https://www.npmjs.com/package/tsx) available in `PATH` (`pnpm add -g tsx` or similar)
- Web Annotator extension installed in your browser
- `ann` CLI on `PATH` (from the annotator-extension's `cli/`) — the plugin will auto-spawn `ann serve` the first time a hook fires if the port is free

Install the plugin:
```bash
git clone <this-repo-url> ~/.claude/plugins/handoff
cd ~/.claude/plugins/handoff
pnpm install
```

Restart Claude Code so the hook registers.

## Using the TASK: convention

The plugin ships a companion skill that Claude will invoke whenever you ask it to send you to a URL. The skill teaches Claude this one rule:

> Before opening a URL for the user, emit a line `TASK: <one-sentence what they should do>`.

When Claude follows the convention, a note appears on the page. When Claude doesn't, no note appears — no heuristics, no silent fallbacks.

## Troubleshooting

- **No note appears.** Confirm `ann serve` is running (`curl http://localhost:7717/health`), the extension is loaded, and Claude actually wrote a `TASK:` line (check the transcript).
- **Note appears on the wrong URL.** The queue canonicalizes URLs (lowercases scheme/host, strips trailing slash, drops fragment). If the site redirects, the queued URL and the final URL may not match. Zombie entries age out of the queue under LRU pressure.
- **Port 7717 already in use.** Another `ann serve` is running or a different service holds it. The plugin will not start a second server.

## Non-goals

See the design doc in the annotator-extension repo (`docs/superpowers/specs/2026-04-17-handoff-plugin-design.md`). In short: no LLM fallback, no time-based expiry, no native-messaging host.
