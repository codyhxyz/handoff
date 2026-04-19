/**
 * Extract a `TASK: <sentence>` preamble from an assistant text block.
 * The convention is taught by the companion skill. No heuristics, no LLM
 * fallback — the hook is deterministic: TASK preamble present → note;
 * absent → no note.
 */
const TASK_RE = /^TASK:\s*(.+?)\s*$/m;

export function extractTask(text: string | undefined | null): string | null {
  if (!text) return null;
  const m = text.match(TASK_RE);
  if (!m || !m[1]) return null;
  return m[1].trim() || null;
}
