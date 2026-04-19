import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { findPrecedingText } from '../scripts/transcript.ts';

const FIXTURE = resolve(import.meta.dirname, 'fixtures/transcript-sample.jsonl');

test('finds preceding text for toolu_ABC', () => {
  const text = findPrecedingText(FIXTURE, 'toolu_ABC');
  assert.ok(text?.includes("I'll open the PR."));
  assert.ok(text?.includes('TASK: Review the auth middleware diff.'));
});

test('finds preceding text for toolu_XYZ', () => {
  const text = findPrecedingText(FIXTURE, 'toolu_XYZ');
  assert.equal(text, 'No TASK line this time.');
});

test('returns null when tool_use_id not found', () => {
  assert.equal(findPrecedingText(FIXTURE, 'toolu_MISSING'), null);
});

test('returns null when transcript file is missing', () => {
  assert.equal(findPrecedingText('/nonexistent/path.jsonl', 'toolu_ABC'), null);
});
