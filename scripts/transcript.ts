/**
 * Find the assistant text block that immediately precedes the tool_use
 * identified by `toolUseId` in a Claude Code transcript JSONL file.
 *
 * Strategy: scan forward (files are small), locate the assistant line
 * containing the matching tool_use id in its content array, then return
 * the last `type:"text"` block that appears before that tool_use inside
 * the same content array. If the containing assistant turn has no
 * preceding text block, return null (we don't walk to prior turns — the
 * skill-taught TASK: convention requires the preamble in the same turn).
 */

import { readFileSync } from 'node:fs';

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
}

interface TranscriptLine {
  type: string;
  message?: {
    role?: string;
    content?: ContentBlock[];
  };
}

export function findPrecedingText(transcriptPath: string, toolUseId: string): string | null {
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

    // Walk backward from the tool_use block to find the most recent text block.
    for (let i = toolIdx - 1; i >= 0; i--) {
      const block = content[i];
      if (block && block.type === 'text' && typeof block.text === 'string') {
        return block.text;
      }
    }
    return null;
  }
  return null;
}
