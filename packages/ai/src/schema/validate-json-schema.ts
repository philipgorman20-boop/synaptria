import type {
  JsonSchema,
  JsonSchemaType,
  JsonSchemaTypeDefinition,
  JsonSchemaValidationIssue,
  JsonSchemaValidationResult,
} from './json-schema';

export function validateJsonAgainstSchema(
  value: unknown,
  schema: JsonSchema,
  path = '$',
): JsonSchemaValidationResult {
  const issues: JsonSchemaValidationIssue[] = [];
  validateValue(value, schema, path, issues);

  return {
    valid: issues.length === 0,
    issues,
  };
}

function isJsonSchemaTypeArray(
  type: JsonSchemaTypeDefinition,
): type is readonly JsonSchemaType[] {
  return Array.isArray(type);
}

function schemaTypes(schema: JsonSchema): readonly JsonSchemaType[] {
  const { type } = schema;
  if (isJsonSchemaTypeArray(type)) {
    return type;
  }

  return [type];
}

function validateValue(
  value: unknown,
  schema: JsonSchema,
  path: string,
  issues: JsonSchemaValidationIssue[],
): void {
  const types = schemaTypes(schema);

  if (types.includes('null') && value === null) {
    return;
  }

  const nonNullTypes = types.filter((type) => type !== 'null');
  if (nonNullTypes.length === 0) {
    if (value !== null) {
      issues.push({ path, message: 'Expected null.' });
    }
    return;
  }

  if (nonNullTypes.length === 1) {
    validateSingleType(value, schema, nonNullTypes[0]!, path, issues);
    return;
  }

  const branchIssues: JsonSchemaValidationIssue[][] = [];
  for (const type of nonNullTypes) {
    const branch: JsonSchemaValidationIssue[] = [];
    validateSingleType(value, schema, type, path, branch);
    if (branch.length === 0) {
      return;
    }
    branchIssues.push(branch);
  }

  issues.push({
    path,
    message: `Expected ${types.join(' | ')}.`,
  });
}

function validateSingleType(
  value: unknown,
  schema: JsonSchema,
  type: JsonSchemaType,
  path: string,
  issues: JsonSchemaValidationIssue[],
): void {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        issues.push({ path, message: 'Expected string.' });
      }
      return;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        issues.push({ path, message: 'Expected number.' });
      }
      return;
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        issues.push({ path, message: 'Expected integer.' });
      }
      return;
    case 'boolean':
      if (typeof value !== 'boolean') {
        issues.push({ path, message: 'Expected boolean.' });
      }
      return;
    case 'array':
      if (!Array.isArray(value)) {
        issues.push({ path, message: 'Expected array.' });
        return;
      }

      if (schema.items !== undefined) {
        value.forEach((item, index) => {
          validateValue(item, schema.items as JsonSchema, `${path}[${index}]`, issues);
        });
      }
      return;
    case 'object':
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        issues.push({ path, message: 'Expected object.' });
        return;
      }

      validateObject(value as Record<string, unknown>, schema, path, issues);
      return;
    case 'null':
      if (value !== null) {
        issues.push({ path, message: 'Expected null.' });
      }
      return;
  }
}

function validateObject(
  value: Record<string, unknown>,
  schema: JsonSchema,
  path: string,
  issues: JsonSchemaValidationIssue[],
): void {
  const required = schema.required ?? [];
  for (const key of required) {
    if (!(key in value)) {
      issues.push({ path: `${path}.${key}`, message: 'Missing required property.' });
    }
  }

  if (schema.properties === undefined) {
    return;
  }

  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    if (!(key in value)) {
      continue;
    }

    validateValue(value[key], propertySchema, `${path}.${key}`, issues);
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in schema.properties)) {
        issues.push({
          path: `${path}.${key}`,
          message: 'Additional property is not allowed.',
        });
      }
    }
  }
}

export function parseStructuredJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw error;
  }
}
