import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getOrSetGroupTask, getGroupTask } from '../scripts/dedupe.ts';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'handoff-dedupe-'));
});

test('first call writes and returns the text', () => {
  const got = getOrSetGroupTask('s1', 'p1', 'do the thing', { dir });
  assert.equal(got, 'do the thing');
});

test('subsequent call with same session+parent reads cached text', () => {
  getOrSetGroupTask('s1', 'p1', 'do the thing', { dir });
  const got = getOrSetGroupTask('s1', 'p1', 'IGNORED', { dir });
  assert.equal(got, 'do the thing');
});

test('different parent gets a fresh slot', () => {
  getOrSetGroupTask('s1', 'p1', 'first', { dir });
  const got = getOrSetGroupTask('s1', 'p2', 'second', { dir });
  assert.equal(got, 'second');
});

test('getGroupTask returns null for unwritten slots (no poisoning)', () => {
  assert.equal(getGroupTask('s1', 'p1', { dir }), null);
  // A later sibling with the real TASK text should still win.
  const winner = getOrSetGroupTask('s1', 'p1', 'real task', { dir });
  assert.equal(winner, 'real task');
  assert.equal(getGroupTask('s1', 'p1', { dir }), 'real task');
});

test('getGroupTask reads what getOrSetGroupTask wrote', () => {
  getOrSetGroupTask('s1', 'p1', 'cached', { dir });
  assert.equal(getGroupTask('s1', 'p1', { dir }), 'cached');
});
