import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { findPrecedingText } from '../scripts/transcript.ts';

const FIXTURE = resolve(import.meta.dirname, 'fixtures/transcript-sample.jsonl');

test('finds preceding text for toolu_ABC', () => {
  const result = findPrecedingText(FIXTURE, 'toolu_ABC');
  assert.ok(result?.text?.includes("I'll open the PR."));
  assert.ok(result?.text?.includes('TASK: Review the auth middleware diff.'));
  assert.equal(result?.assistantUuid, 'asst-uuid-1');
});

test('sibling tool_use in the same assistant line shares the uuid', () => {
  const a = findPrecedingText(FIXTURE, 'toolu_ABC');
  const b = findPrecedingText(FIXTURE, 'toolu_ABC_SIB');
  assert.equal(a?.assistantUuid, b?.assistantUuid);
  assert.equal(a?.text, b?.text);
});

test('finds preceding text for toolu_XYZ', () => {
  const result = findPrecedingText(FIXTURE, 'toolu_XYZ');
  assert.equal(result?.text, 'No TASK line this time.');
  assert.equal(result?.assistantUuid, 'asst-uuid-2');
});

test('returns null when tool_use_id not found', () => {
  assert.equal(findPrecedingText(FIXTURE, 'toolu_MISSING'), null);
});

test('returns null when transcript file is missing', () => {
  assert.equal(findPrecedingText('/nonexistent/path.jsonl', 'toolu_ABC'), null);
});
