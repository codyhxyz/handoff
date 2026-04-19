#!/bin/sh
# Prefilter for the Handoff PreToolUse hook.
#
# The matcher fires on every Bash and WebFetch call. We only care about
# ones that open a URL. Spawning tsx to discover "nothing to do" on every
# `ls` or `git status` is wasteful, so peek at stdin and only forward to
# url-hook.ts when the input looks capable of yielding a URL open.
#
# False positives are harmless — url-hook.ts no-ops when no URL is
# extracted. False negatives would silently drop a handoff note, so keep
# the patterns broad.

input=$(cat)
case "$input" in
  *'"tool_name":"WebFetch"'*|*open*|*start*)
    # `|| true` so tsx-not-found or hook errors never block the tool call.
    printf '%s' "$input" | tsx "$(dirname "$0")/url-hook.ts" || true
    ;;
esac
exit 0
