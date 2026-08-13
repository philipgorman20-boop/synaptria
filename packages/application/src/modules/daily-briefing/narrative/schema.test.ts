import assert from 'node:assert/strict';
import test from 'node:test';

import { validateJsonAgainstSchema, type JsonSchema } from '@synaptria/ai';

import {
  DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA,
  type DailyBriefingNarrativeV0StructuredOutput,
} from './schema';
import {
  emptyGroundedNarrativePayload,
  groundedNarrativePayload,
} from './testing/fixtures';
import { parseDailyBriefingNarrativeStructuredOutput } from './provider-response';

function collectObjectSchemas(schema: JsonSchema, found: JsonSchema[] = []): JsonSchema[] {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.includes('object')) {
    found.push(schema);
  }

  if (schema.properties !== undefined) {
    for (const propertySchema of Object.values(schema.properties)) {
      collectObjectSchemas(propertySchema, found);
    }
  }

  if (schema.items !== undefined) {
    collectObjectSchemas(schema.items, found);
  }

  return found;
}

function assertStrictObjectSchemas(schema: JsonSchema): void {
  for (const objectSchema of collectObjectSchemas(schema)) {
    const propertyKeys = Object.keys(objectSchema.properties ?? {}).sort();
    const requiredKeys = [...(objectSchema.required ?? [])].sort();
    assert.deepEqual(
      requiredKeys,
      propertyKeys,
      `Object schema at type=${JSON.stringify(objectSchema.type)} must require every property key.`,
    );
  }
}

test('every object schema with properties requires all property keys for strict output', () => {
  assertStrictObjectSchemas(DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA);
});

test('item narrative arrays are bounded for structured output', () => {
  assert.equal(
    DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA.properties?.attentionItems?.maxItems,
    5,
  );
  assert.equal(
    DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA.properties?.projectHighlightItems?.maxItems,
    4,
  );
  assert.equal(
    DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA.properties?.upcomingWorkItems?.maxItems,
    3,
  );
  assert.equal(
    DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA.properties?.recentChangeItems?.maxItems,
    3,
  );
});

test('completenessNote accepts string values in application schema validation', () => {
  const payload = {
    ...groundedNarrativePayload(),
    completenessNote: 'Some project execution data is restricted in this briefing.',
  };

  const result = validateJsonAgainstSchema(payload, DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA);
  assert.equal(result.valid, true);
  assert.doesNotThrow(() => parseDailyBriefingNarrativeStructuredOutput(payload));
});

test('completenessNote accepts null values in application schema validation', () => {
  const payload = {
    ...groundedNarrativePayload(),
    completenessNote: null,
  };

  const result = validateJsonAgainstSchema(payload, DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA);
  assert.equal(result.valid, true);
  assert.doesNotThrow(() => parseDailyBriefingNarrativeStructuredOutput(payload));
});

test('completenessNote cannot be omitted from structured output', () => {
  const payload = groundedNarrativePayload();
  const { completenessNote: _omitted, ...withoutNote } = payload;

  const result = validateJsonAgainstSchema(withoutNote, DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA);
  assert.equal(result.valid, false);
  assert.match(result.issues.map((issue) => issue.message).join(' '), /Missing required property/i);
});

test('grounded narrative fixtures remain valid with null completenessNote', () => {
  for (const payload of [groundedNarrativePayload(), emptyGroundedNarrativePayload()]) {
    const result = validateJsonAgainstSchema(payload, DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA);
    assert.equal(result.valid, true);

    const parsed: DailyBriefingNarrativeV0StructuredOutput =
      parseDailyBriefingNarrativeStructuredOutput(payload);
    assert.equal(parsed.completenessNote, null);
  }
});
