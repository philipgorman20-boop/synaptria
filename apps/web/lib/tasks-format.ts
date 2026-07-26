import { taskId, type TaskId } from '@synaptria/core';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseTaskRouteParam(
  rawTaskId: string | undefined,
): TaskId | null {
  if (typeof rawTaskId !== 'string') {
    return null;
  }

  const normalized = rawTaskId.trim();
  if (!UUID_PATTERN.test(normalized)) {
    return null;
  }

  return taskId(normalized);
}
