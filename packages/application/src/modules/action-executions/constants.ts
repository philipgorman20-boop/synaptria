/** Action proposal types currently eligible for execution authorization. */
export const SUPPORTED_EXECUTION_ACTION_TYPES = [
  'ESCALATE_BLOCKED_OVERDUE_TASK_PRIORITY',
] as const;

export type SupportedExecutionActionType = (typeof SUPPORTED_EXECUTION_ACTION_TYPES)[number];

export function isSupportedExecutionActionType(actionType: string): actionType is SupportedExecutionActionType {
  return (SUPPORTED_EXECUTION_ACTION_TYPES as readonly string[]).includes(actionType);
}
