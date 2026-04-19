/**
 * POST a pending note to `ann serve` at localhost:7717. If the port is
 * not bound, attempt a one-shot detached spawn of `ann serve` and retry
 * after a short delay. If that fails, log and return — the hook must
 * never block the user's tool call.
 */

import { spawn } from 'node:child_process';

const BRIDGE_URL = 'http://localhost:7717';
const POST_PATH = '/pending-notes';
const SPAWN_DELAY_MS = 800;

export interface PendingNotePayload {
  url: string;
  text: string;
  color?: string;
  tags?: string[];
}

export async function postPendingNote(payload: PendingNotePayload): Promise<boolean> {
  if (await tryPost(payload)) return true;
  spawnAnnServe();
  await sleep(SPAWN_DELAY_MS);
  return tryPost(payload);
}

async function tryPost(payload: PendingNotePayload): Promise<boolean> {
  try {
    const r = await fetch(`${BRIDGE_URL}${POST_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return r.ok;
  } catch {
    return false;
  }
}

function spawnAnnServe(): void {
  try {
    const child = spawn('ann', ['serve'], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  } catch (err) {
    console.error('[handoff] failed to spawn ann serve:', (err as Error).message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
