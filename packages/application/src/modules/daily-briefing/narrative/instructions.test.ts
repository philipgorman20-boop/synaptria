import assert from 'node:assert/strict';
import test from 'node:test';

import { DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS } from './instructions';

test('narrative instructions require a concise operational headline', () => {
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /approximately 8-14 words/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /dominant operational condition/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Do not enumerate every project/i);
});

test('narrative instructions prohibit raw ISO timestamps in prose', () => {
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Never output raw ISO timestamps/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /2026-07-26T12:00:00\.000Z/);
});

test('narrative instructions discourage repeating deterministic fields verbatim', () => {
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Avoid repeating deterministic snapshot text verbatim/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Do not simply restate title, severity, due date/i);
  assert.match(
    DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS,
    /Add executive interpretation or synthesis rather than restating deterministic fields verbatim/i,
  );
});

test('narrative instructions require bounded per-item narratives via narrativeTargets', () => {
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /narrativeTargets/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /omit that item from the array/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Only write item narratives when they add meaningful executive interpretation/i);
});

test('narrative instructions preserve authoritative snapshot and evidence grounding rules', () => {
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Treat every deterministic snapshot field as authoritative/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Do not recalculate, infer, or invent operational facts/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /must cite one or more evidenceKeys/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /Do not cite evidenceKeys that are not present/i);
  assert.match(
    DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS,
    /headline and executiveSummary must each include at least one valid evidenceKey/i,
  );
});

test('narrative instructions encourage concise executive synthesis for summary and bounded items', () => {
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /approximately 2-4 concise sentences/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /one short sentence per included item/i);
  assert.match(DAILY_BRIEFING_NARRATIVE_INSTRUCTIONS, /execution pressure/i);
});
