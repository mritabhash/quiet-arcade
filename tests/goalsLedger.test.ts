import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateGoals } from '../scripts/validateGoals.mjs';

const valid = `
version: 1
goals:
  - id: qa-001
    title: "t"
    rationale: "r"
    effort: S
    status: approved
    migration: false
    branch: null
    pr: null
    preview_url: null
    notes: null
    outcome: null
`;

test('repo ledger is valid', () => {
  const text = readFileSync(new URL('../docs/agent/goals.yaml', import.meta.url), 'utf8');
  assert.equal(validateGoals(text).ok, true);
});

test('valid synthetic ledger passes', () => {
  assert.equal(validateGoals(valid).ok, true);
});

test('duplicate ids fail', () => {
  const dup = valid + valid.slice(valid.indexOf('  - id:'));
  const res = validateGoals(dup);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e: string) => e.includes('duplicate')));
});

test('bad status fails', () => {
  const res = validateGoals(valid.replace('status: approved', 'status: shipped'));
  assert.equal(res.ok, false);
});

test('more than 3 active goals fails', () => {
  const goal = valid.slice(valid.indexOf('  - id:'));
  let many = 'version: 1\ngoals:\n';
  for (let i = 1; i <= 4; i++) many += goal.replace('qa-001', `qa-00${i}`);
  const res = validateGoals(many);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e: string) => e.includes('active')));
});
