import type { EntityType } from '@synaptria/domain/context';

import type { ActionProposalActionType } from './constants';

export const OPERATIONAL_MUTABLE_FIELDS_BY_ENTITY = {
  Task: ['status', 'priority', 'plannedEndDate'],
  Milestone: ['status', 'priority', 'plannedEndDate'],
  Project: ['status', 'priority', 'targetEndDate'],
} as const satisfies Record<'Task' | 'Milestone' | 'Project', readonly string[]>;

export const OPERATIONAL_PRECONDITION_FIELDS_BY_ENTITY = {
  Task: [...OPERATIONAL_MUTABLE_FIELDS_BY_ENTITY.Task, 'updatedAt'],
  Milestone: [...OPERATIONAL_MUTABLE_FIELDS_BY_ENTITY.Milestone, 'updatedAt'],
  Project: [...OPERATIONAL_MUTABLE_FIELDS_BY_ENTITY.Project, 'updatedAt'],
} as const satisfies Record<'Task' | 'Milestone' | 'Project', readonly string[]>;

export type OperationalMutableEntityType = keyof typeof OPERATIONAL_MUTABLE_FIELDS_BY_ENTITY;

export const OPERATIONAL_ACTION_PROPOSAL_MAPPINGS = {} as const satisfies Partial<
  Record<ActionProposalActionType, readonly string[]>
>;

function fieldsForEntity<
  const TEntity extends OperationalMutableEntityType,
  const TFields extends Record<TEntity, readonly string[]>,
>(entityType: EntityType, fieldsByEntity: TFields): ReadonlySet<string> | undefined {
  if (!(entityType in fieldsByEntity)) {
    return undefined;
  }

  const fields = fieldsByEntity[entityType as TEntity];
  return new Set(fields);
}

export function getAllowlistedMutableFieldsForTarget(
  entityType: EntityType,
): ReadonlySet<string> | undefined {
  return fieldsForEntity(entityType, OPERATIONAL_MUTABLE_FIELDS_BY_ENTITY);
}

export function getAllowlistedPreconditionFieldsForTarget(
  entityType: EntityType,
): ReadonlySet<string> | undefined {
  return fieldsForEntity(entityType, OPERATIONAL_PRECONDITION_FIELDS_BY_ENTITY);
}

export function getAllowlistedFieldsForActionType(
  actionType: ActionProposalActionType,
): ReadonlySet<string> | undefined {
  if (!(actionType in OPERATIONAL_ACTION_PROPOSAL_MAPPINGS)) {
    return undefined;
  }

  const fields =
    OPERATIONAL_ACTION_PROPOSAL_MAPPINGS[
      actionType as keyof typeof OPERATIONAL_ACTION_PROPOSAL_MAPPINGS
    ];

  return new Set(fields);
}
