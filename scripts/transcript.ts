/**
 * Find the assistant turn that contains a given tool_use, returning both
 * the preceding text block (if any) and the assistant line's own uuid.
 *
 * The uuid is how we dedupe sibling tool_use blocks in the same turn:
 * every sibling inside one assistant message shares that line's uuid,
 * while each has its own distinct `tool_use.id`. Using the line uuid as
 * the dedupe key lets the second, third, ... sibling reuse the TASK text
 * that the first sibling cached, without re-parsing the transcript.
 *
 * Strategy: scan forward (files are small), find the assistant line
 * whose content array contains the matching tool_use id, then walk
 * backward inside that same content array for the most recent text
 * block. Returns null only when the tool_use id is not found anywhere.
 */

import { readFileSync } from 'node:fs';

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
}

interface TranscriptLine {
  type: string;
  uuid?: string;
  message?: {
    role?: string;
    content?: ContentBlock[];
  };
}

export interface PrecedingContext {
  /** Text of the most recent text block before the tool_use, or null. */
  text: string | null;
  /** uuid of the assistant JSONL line that contains the tool_use. */
  assistantUuid: string;
}

export function findPrecedingText(
  transcriptPath: string,
  toolUseId: string,
): PrecedingContext | null {
  let raw: string;
  try { raw = readFileSync(transcriptPath, 'utf-8'); } catch { return null; }

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let entry: TranscriptLine;
    try { entry = JSON.parse(line) as TranscriptLine; } catch { continue; }
    if (entry.type !== 'assistant') continue;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;

    const toolIdx = content.findIndex(b => b.type === 'tool_use' && b.id === toolUseId);
    if (toolIdx < 0) continue;

    // Line's uuid is the dedupe key; fall back to the tool_use id if the
    // transcript line has no uuid (older Claude Code versions, synthetic
    // fixtures). Fallback still works, just without cross-sibling sharing.
    const assistantUuid = entry.uuid ?? toolUseId;

    for (let i = toolIdx - 1; i >= 0; i--) {
      const block = content[i];
      if (block && block.type === 'text' && typeof block.text === 'string') {
        return { text: block.text, assistantUuid };
      }
    }
    return { text: null, assistantUuid };
  }
  return null;
}
