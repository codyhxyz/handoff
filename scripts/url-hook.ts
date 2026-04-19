#!/usr/bin/env -S tsx
/**
 * Handoff PreToolUse hook.
 *
 * Reads JSON on stdin (Claude Code hook input protocol):
 *   { session_id, transcript_path, tool_name, tool_input, tool_use_id, ... }
 *
 * For Bash `open|xdg-open|start <url>` or WebFetch, extracts a URL,
 * reverse-scans the transcript to find the preceding assistant text,
 * greps for `TASK: <sentence>`, and POSTs to the localhost pending-notes
 * queue. Exits 0 in all cases — a hook failure must never block the tool.
 */

import { findPrecedingText } from './transcript.ts';
import { extractTask } from './extract-task.ts';
import { getOrSetGroupTask, getGroupTask } from './dedupe.ts';
import { postPendingNote } from './post-to-bridge.ts';
import { readFileSync } from 'node:fs';

interface HookInput {
  session_id?: string;
  transcript_path?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_use_id?: string;
}

async function main(): Promise<void> {
  const input = readStdin();
  if (!input) return exit(0);

  const urls = extractUrls(input);
  if (urls.length === 0) return exit(0);

  const transcriptPath = input.transcript_path;
  const toolUseId = input.tool_use_id;
  const sessionId = input.session_id ?? 'unknown-session';
  if (!transcriptPath || !toolUseId) return exit(0);

  const preceding = findPrecedingText(transcriptPath, toolUseId);
  const taskFromText = extractTask(preceding?.text ?? null);
  const parentMessageId = preceding?.assistantUuid ?? toolUseId;

  // If this sibling found a TASK line, write-if-absent so later siblings
  // in the turn reuse it. Otherwise, pure-read to pick up what a prior
  // sibling already cached. The pure read avoids poisoning the slot with
  // a sentinel that would block a still-later sibling's TASK from winning.
  const taskText = taskFromText
    ? getOrSetGroupTask(sessionId, parentMessageId, taskFromText)
    : getGroupTask(sessionId, parentMessageId);

  if (!taskText) return exit(0);  // no TASK preamble, no note

  for (const url of urls) {
    await postPendingNote({
      url,
      text: taskText,
      color: '#c7d2fe',
      tags: ['claude-task'],
    });
  }
  exit(0);
}

function readStdin(): HookInput | null {
  try {
    const raw = readFileSync(0, 'utf-8');
    if (!raw.trim()) return null;
    return JSON.parse(raw) as HookInput;
  } catch {
    return null;
  }
}

function extractUrls(input: HookInput): string[] {
  const name = input.tool_name;
  const args = input.tool_input ?? {};
  if (name === 'WebFetch' && typeof args.url === 'string') {
    return [args.url];
  }
  if (name === 'Bash' && typeof args.command === 'string') {
    return extractUrlsFromBashCommand(args.command);
  }
  return [];
}

function extractUrlsFromBashCommand(cmd: string): string[] {
  const urls: string[] = [];
  const re = /\b(?:open|xdg-open|start)\s+(?:-[a-zA-Z]+\s+)*("https?:\/\/[^"]+"|'https?:\/\/[^']+'|https?:\/\/\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd))) {
    const raw = m[1];
    if (!raw) continue;
    const unquoted = raw.replace(/^["']|["']$/g, '');
    urls.push(unquoted);
  }
  return urls;
}

function exit(code: number): void {
  process.exit(code);
}

void main();
