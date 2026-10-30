import type { JsonObject, JsonValue } from './types';

const DEFAULT_MAX_DEPTH = 12;

export interface ToAuditJsonOptions {
  maxDepth?: number;
  redactKeys?: readonly string[];
}

const DEFAULT_REDACT_KEYS = [
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'idToken',
  'secret',
  'apiKey',
  'authorization',
] as const;

function normalizeKey(key: string): string {
  return key.replaceAll('_', '').replaceAll('-', '').toLowerCase();
}

function isRedactedKey(key: string, redactedKeys: ReadonlySet<string>): boolean {
  return redactedKeys.has(normalizeKey(key));
}

function convert(
  value: unknown,
  depth: number,
  maxDepth: number,
  redactedKeys: ReadonlySet<string>,
  seen: WeakSet<object>,
): JsonValue {
  if (depth > maxDepth) return '[MAX_DEPTH]';
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'undefined') return null;
  if (typeof value === 'symbol') return String(value);
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => convert(item, depth + 1, maxDepth, redactedKeys, seen));
    }

    const result: Record<string, JsonValue> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = isRedactedKey(key, redactedKeys)
        ? '[REDACTED]'
        : convert(nestedValue, depth + 1, maxDepth, redactedKeys, seen);
    }
    return result;
  }

  return String(value);
}

export function toAuditJson(value: unknown, options: ToAuditJsonOptions = {}): JsonValue {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const redactedKeys = new Set(
    [...DEFAULT_REDACT_KEYS, ...(options.redactKeys ?? [])].map(normalizeKey),
  );

  return convert(value, 0, maxDepth, redactedKeys, new WeakSet<object>());
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function toAuditJsonObject(
  value: Readonly<Record<string, unknown>>,
  options?: ToAuditJsonOptions,
): JsonObject {
  const converted = toAuditJson(value, options);
  if (!isJsonObject(converted)) {
    throw new TypeError('Audit metadata must serialize to a JSON object.');
  }

  return converted;
}
