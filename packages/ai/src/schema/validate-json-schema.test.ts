import assert from 'node:assert/strict';
import test from 'node:test';

import type { JsonSchema } from './json-schema';
import { validateJsonAgainstSchema } from './validate-json-schema';

test('validateJsonAgainstSchema accepts nullable string values', () => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      note: {
        type: ['string', 'null'],
      },
    },
    required: ['note'],
    additionalProperties: false,
  };

  assert.equal(validateJsonAgainstSchema({ note: 'present' }, schema).valid, true);
  assert.equal(validateJsonAgainstSchema({ note: null }, schema).valid, true);
});

test('validateJsonAgainstSchema rejects omitted nullable required properties', () => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      note: {
        type: ['string', 'null'],
      },
    },
    required: ['note'],
    additionalProperties: false,
  };

  const result = validateJsonAgainstSchema({}, schema);
  assert.equal(result.valid, false);
  assert.match(result.issues[0]?.message ?? '', /Missing required property/i);
});
