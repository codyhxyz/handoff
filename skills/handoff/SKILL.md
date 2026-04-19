---
name: handoff
description: Use whenever you are about to open a URL in the user's browser for them to take an action. Tells you how to include a one-sentence task context line that appears as a sticky note on the page.
---

# Handoff — leave the user a task note when you send them to a browser page

When you open a URL for the user (any `Bash` `open <url>` / `xdg-open <url>` / `start <url>` command, or a `WebFetch` the user is meant to visit themselves), the Handoff plugin's hook will drop a sticky note on that page telling them what they're supposed to do once they arrive.

**To make that note appear, include a single line in your assistant text *immediately before* invoking the tool, in this exact format:**

```
TASK: <one-sentence description of what the user should do on this page>
```

## Rules

- The line MUST start with the literal prefix `TASK:` at the beginning of a line (no leading whitespace).
- One sentence. Imperative voice. No trailing list of sub-items.
- Describe the *action* the user should take, not the *reason*. "Review the auth middleware diff" — not "Because we changed the auth flow, you should look at…"
- If you are not sending the user to take an action (e.g., you're fetching a URL purely for your own reading), **do not** write a TASK line.

## Example

> I've found three failing tests. Let me open the PR so you can review the fix before I push.
>
> TASK: Review the auth middleware diff and leave a comment if the token-refresh change looks wrong.

Then invoke `Bash { command: "open https://github.com/foo/bar/pull/42" }`. The plugin places a sticky note on that page reading *"Review the auth middleware diff and leave a comment if the token-refresh change looks wrong."*

## What not to do

- ❌ `TASK:` without the prefix on a fresh line — the hook regex is anchored to line start.
- ❌ Multiple `TASK:` lines. Only the first is used.
- ❌ TASK lines when you aren't sending the user to do something. No note is better than a noisy one.
- ❌ Relying on this when the user explicitly asks for no notes. Honor "don't handoff" / "no notes" / etc.
