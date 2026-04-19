import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTask } from '../scripts/extract-task.ts';

test('extracts a single-line TASK preamble', () => {
  assert.equal(
    extractTask("I'll open the PR now.\nTASK: Review the auth middleware changes."),
    'Review the auth middleware changes.'
  );
});

test('returns null when no TASK line present', () => {
  assert.equal(extractTask("I'll open the PR now."), null);
});

test('trims whitespace around the captured text', () => {
  assert.equal(extractTask('TASK:   do the thing   '), 'do the thing');
});

test('takes the first TASK line when multiple exist', () => {
  assert.equal(
    extractTask('TASK: first\nthen more text\nTASK: second'),
    'first'
  );
});

test('anchored to line start — ignores "TASK:" mid-line', () => {
  assert.equal(
    extractTask('Here is a note about TASK: something (not a preamble)'),
    null
  );
});

test('null for empty or undefined input', () => {
  assert.equal(extractTask(''), null);
  assert.equal(extractTask(undefined), null);
});
