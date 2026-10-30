import type { EventJsonObject, EventJsonValue } from './types';

const REDACTED = '[REDACTED]';
const CIRCULAR = '[CIRCULAR]';

const sensitiveKeys = new Set([
  'access_token',
  'authorization',
  'client_secret',
  'cookie',
  'password',
  'refresh_token',
  'secret',
  'token',
]);

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replaceAll('-', '_');
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return sensitiveKeys.has(normalized) || normalized.endsWith('_token') || normalized.endsWith('_secret');
}

function serialize(value: unknown, seen: WeakSet<object>, key?: string): EventJsonValue {
  if (key !== undefined && isSensitiveKey(key)) {
    return REDACTED;
  }

  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return CIRCULAR;
    }

    seen.add(value);

    try {
      if (Array.isArray(value)) {
        return value.map((item) => serialize(item, seen));
      }

      const result: Record<string, EventJsonValue> = {};
      for (const [entryKey, entryValue] of Object.entries(value)) {
        result[entryKey] = serialize(entryValue, seen, entryKey);
      }
      return result;
    } finally {
      seen.delete(value);
    }
  }

  return String(value);
}

export function toEventJson(value: unknown): EventJsonValue {
  return serialize(value, new WeakSet<object>());
}

export function isEventJsonObject(value: EventJsonValue): value is EventJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toEventJsonObject(value: Readonly<Record<string, unknown>>): EventJsonObject {
  const converted = toEventJson(value);
  if (!isEventJsonObject(converted)) {
    throw new TypeError('Event metadata must serialize to a JSON object.');
  }
  return converted;
}
