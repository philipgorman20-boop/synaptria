import {
  MISSION_CONTROL_DEMO_CODE_PREFIX,
  MISSION_CONTROL_DEMO_CORRELATION_ID,
  MISSION_CONTROL_DEMO_SEED_MARKER,
} from './constants';

export function isMissionControlDemoCode(
  code: string | null | undefined,
): boolean {
  return typeof code === 'string' && code.startsWith(MISSION_CONTROL_DEMO_CODE_PREFIX);
}

export function isMissionControlDemoCorrelationId(
  correlationId: string | null | undefined,
): boolean {
  return correlationId === MISSION_CONTROL_DEMO_CORRELATION_ID;
}

export function isMissionControlDemoEventMetadata(
  metadata: unknown,
): boolean {
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }

  const record = metadata as Record<string, unknown>;
  return record.seed === MISSION_CONTROL_DEMO_SEED_MARKER;
}
