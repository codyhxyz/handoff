/**
 * Dedupe sibling tool_use calls within the same assistant turn.
 * All URL opens in one assistant message share one preceding TASK: line;
 * we want the same text on every queued note without re-parsing for each
 * sibling. Keyed by (session, parent_assistant_message_uuid) in a tmp file.
 *
 * First hook fire in the group writes the text; later siblings read it.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface DedupeOpts {
  dir?: string;
}

export function getOrSetGroupTask(
  sessionId: string,
  parentMessageId: string,
  candidate: string,
  opts: DedupeOpts = {},
): string {
  const file = slotPath(sessionId, parentMessageId, opts);
  if (existsSync(file)) {
    return readFileSync(file, 'utf-8');
  }
  writeFileSync(file, candidate);
  return candidate;
}

/** Pure read — returns null if no sibling has written to this slot yet. */
export function getGroupTask(
  sessionId: string,
  parentMessageId: string,
  opts: DedupeOpts = {},
): string | null {
  const file = slotPath(sessionId, parentMessageId, opts);
  return existsSync(file) ? readFileSync(file, 'utf-8') : null;
}

function slotPath(sessionId: string, parentMessageId: string, opts: DedupeOpts): string {
  const dir = opts.dir ?? tmpdir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const key = `handoff-${sanitize(sessionId)}-${sanitize(parentMessageId)}`;
  return join(dir, key);
}

function sanitize(s: string): string {
  return s.replace(/[^A-Za-z0-9_-]/g, '_');
}
