export type JsonSchemaType =
  | 'object'
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array';

/** Narrow JSON Schema subset used for provider-independent structured output. */
export interface JsonSchema {
  readonly type: JsonSchemaType;
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly required?: readonly string[];
  readonly items?: JsonSchema;
  readonly additionalProperties?: boolean;
  readonly description?: string;
}

export interface JsonSchemaValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface JsonSchemaValidationResult {
  readonly valid: boolean;
  readonly issues: readonly JsonSchemaValidationIssue[];
}

export function jsonSchemaToRecord(schema: JsonSchema): Record<string, unknown> {
  const record: Record<string, unknown> = {
    type: schema.type,
  };

  if (schema.properties !== undefined) {
    record.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [
        key,
        jsonSchemaToRecord(value),
      ]),
    );
  }

  if (schema.required !== undefined) {
    record.required = [...schema.required];
  }

  if (schema.items !== undefined) {
    record.items = jsonSchemaToRecord(schema.items);
  }

  if (schema.additionalProperties !== undefined) {
    record.additionalProperties = schema.additionalProperties;
  }

  if (schema.description !== undefined) {
    record.description = schema.description;
  }

  return record;
}
