import type { Clock, IdGenerator } from '@synaptria/core';
import { identifier } from '@synaptria/core';
import type {
  CorrelationId,
  MembershipId,
  OrganizationId,
  RequestId,
  UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  ContextAuthorization,
  ContextContribution,
  ContextIdentity,
  ContextPackage,
  ContextRequest,
} from '@synaptria/domain/context';
import {
  CONTEXT_PACKAGE_VERSION,
  validateContextContribution,
  validateContextPackage,
  validateContextRequest,
} from '@synaptria/domain/context';
import { permissionsForRole } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import { assessCompleteness, assessConfidence } from './assessment';
import { resolveCapabilityDefinition } from './capabilities/registry';
import type { ContextCapabilityDefinition } from './capabilities/types';
import {
  createDefaultContextAssemblyAuthorizer,
  type ContextAssemblyAuthorizer,
} from './context-assembly-authorizer';
import { enforceContributionBudget } from './enforce-contribution-budget';
import { collectProvenanceRecords } from './provenance';
import type { ContextProviderInput } from './ports/context-provider';
import type { OrganizationalMemoryProvider } from './ports/organizational-memory-provider';
import { PrimaryEntityContextProvider } from './providers/primary-entity-provider';
import { RelatedEntitiesContextProvider } from './providers/related-entities-provider';
import { AggregateEventContextProvider } from './providers/aggregate-event-provider';
import { NoOpOrganizationalMemoryProvider } from './providers/no-op-organizational-memory-provider';
import { resolveContextScope } from './scope/resolve-context-scope';
import { compareEntityReferences } from './sorting';

export interface AssembleContextContext {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface AssembleContextInput {
  readonly capabilityId: string;
  readonly request: ContextRequest;
}

export interface AssembleContextOutput {
  readonly contextPackage: ContextPackage;
}

export interface AssembleContextDependencies {
  readonly primaryEntityProvider: PrimaryEntityContextProvider;
  readonly relatedEntitiesProvider: RelatedEntitiesContextProvider;
  readonly aggregateEventProvider: AggregateEventContextProvider;
  readonly organizationalMemoryProvider: OrganizationalMemoryProvider;
  readonly contextAssemblyAuthorizer: ContextAssemblyAuthorizer;
  readonly resolveCapabilityDefinition?: (
    capabilityId: string,
  ) => ContextCapabilityDefinition | null;
  readonly clock: Clock;
  readonly packageIdGenerator: IdGenerator;
}

export class AssembleContextUseCase {
  constructor(private readonly dependencies: AssembleContextDependencies) {}

  async execute(
    context: AssembleContextContext,
    input: AssembleContextInput,
  ): Promise<AssembleContextOutput> {
    const request = validateContextRequest(input.request);
    const capability = this.resolveCapability(input.capabilityId);
    this.assertPrimaryEntityMatchesCapability(request, capability);
    this.assertOrganizationScope(context, request);

    const identity = this.buildIdentity(context);
    const authorization = this.buildAuthorization(context);
    const scope = resolveContextScope({
      organizationId: context.organizationId,
      request,
      capability,
    });

    this.dependencies.contextAssemblyAuthorizer.authorizePrimaryEntityRead(
      authorization,
      request.primaryEntity,
    );

    const providerInput: ContextProviderInput = {
      request,
      scope,
      identity,
      authorization,
      capability,
    };

    const providerFailures: string[] = [];

    const primaryContributions = await this.runRequiredProvider(
      'primaryEntity',
      () => this.dependencies.primaryEntityProvider.contribute(providerInput),
    );
    const primaryEntity = this.extractSingleContribution(primaryContributions, 'primaryEntity');

    let relatedEntities: readonly ContextContribution[] = [];
    let relatedEntitiesPermissionRestricted = false;

    if (this.shouldIncludeSection(request, capability, 'relatedEntities')) {
      try {
        const relatedResult =
          await this.dependencies.relatedEntitiesProvider.contributeWithMetadata(providerInput);
        relatedEntities = this.validateContributions(relatedResult.contributions, 'relatedEntities');
        relatedEntitiesPermissionRestricted = relatedResult.permissionRestricted;
      } catch (error) {
        providerFailures.push(formatProviderFailure('relatedEntities', error));
        relatedEntities = [];
      }
    }

    let events: readonly ContextContribution[] = [];
    if (this.shouldIncludeSection(request, capability, 'events')) {
      try {
        events = this.validateContributions(
          await this.dependencies.aggregateEventProvider.contribute(providerInput),
          'events',
        );
      } catch (error) {
        providerFailures.push(formatProviderFailure('events', error));
        events = [];
      }
    }

    let organizationalMemory: readonly ContextContribution[] = [];
    let organizationalMemoryUnavailable = false;
    if (this.shouldIncludeSection(request, capability, 'organizationalMemory')) {
      try {
        const memoryResult =
          await this.dependencies.organizationalMemoryProvider.retrieve({
            ...providerInput,
            operationalContext: [primaryEntity, ...relatedEntities, ...events],
          });

        if (memoryResult.status === 'unavailable') {
          organizationalMemoryUnavailable = true;
          organizationalMemory = [];
        } else {
          organizationalMemory = this.validateContributions(
            memoryResult.contributions,
            'organizationalMemory',
          );
        }
      } catch (error) {
        providerFailures.push(formatProviderFailure('organizationalMemory', error));
        organizationalMemory = [];
      }
    }

    const organizationalMemoryRequested = this.shouldIncludeSection(
      request,
      capability,
      'organizationalMemory',
    );

    const sortedRelatedEntities = sortContributions(relatedEntities);
    const sortedEvents = sortContributions(events);
    const sortedOrganizationalMemory = sortContributions(organizationalMemory);

    const budgetResult = enforceContributionBudget({
      maxContributions: scope.maxContributions,
      relatedEntities: sortedRelatedEntities,
      events: sortedEvents,
      organizationalMemory: sortedOrganizationalMemory,
    });

    relatedEntities = budgetResult.relatedEntities;
    events = budgetResult.events;
    organizationalMemory = budgetResult.organizationalMemory;

    const confidence = assessConfidence({
      capability,
      relatedEntities,
      events,
      organizationalMemory,
      relatedEntitiesPermissionRestricted,
      relatedEntitiesExpected: capability.includeDescendants.length > 0,
      organizationalMemoryRequested,
      organizationalMemoryUnavailable,
      relatedEntitiesTruncated: budgetResult.relatedEntitiesTruncated,
    });

    const completeness = assessCompleteness({
      capability,
      requestedSections: request.requestedSections,
      relatedEntities,
      events,
      organizationalMemory,
      relatedEntitiesPermissionRestricted,
      providerFailures,
      organizationalMemoryUnavailable,
      truncatedContributionCount: budgetResult.truncatedContributionCount,
    });

    if (completeness.status === 'insufficient') {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Required context sections could not be assembled.',
        details: { missingSections: completeness.missingSections },
      });
    }

    const allContributions = [
      primaryEntity,
      ...relatedEntities,
      ...events,
      ...organizationalMemory,
    ];

    const contextPackage = validateContextPackage({
      packageId: identifier(
        this.dependencies.packageIdGenerator.generate(),
        'ContextPackageId',
      ),
      packageVersion: CONTEXT_PACKAGE_VERSION,
      assembledAt: this.dependencies.clock.now(),
      request,
      identity,
      authorization,
      primaryEntity,
      relatedEntities,
      events,
      organizationalMemory,
      provenance: collectProvenanceRecords(allContributions),
      confidence,
      completeness,
      metadata: {
        deterministic: true,
      },
    });

    return { contextPackage };
  }

  private resolveCapability(capabilityId: string): ContextCapabilityDefinition {
    const resolve =
      this.dependencies.resolveCapabilityDefinition ?? resolveCapabilityDefinition;
    const capability = resolve(capabilityId);
    if (capability === null) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'The requested context capability is not supported.',
        details: { capabilityId },
      });
    }
    return capability;
  }

  private assertPrimaryEntityMatchesCapability(
    request: ContextRequest,
    capability: ContextCapabilityDefinition,
  ): void {
    if (request.primaryEntity.entityType !== capability.primaryEntityType) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'The requested primary entity type does not match the capability.',
        details: {
          capabilityId: capability.capabilityId,
          entityType: request.primaryEntity.entityType,
        },
      });
    }
  }

  private assertOrganizationScope(
    context: AssembleContextContext,
    request: ContextRequest,
  ): void {
    if (context.organizationId !== request.primaryEntity.organizationId) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'The requested primary entity was not found.',
        details: { entityId: request.primaryEntity.entityId },
      });
    }
  }

  private buildIdentity(context: AssembleContextContext): ContextIdentity {
    return {
      userId: context.userId,
      organizationId: context.organizationId,
      membershipId: context.membershipId,
      requestId: context.requestId,
      correlationId: context.correlationId,
    };
  }

  private buildAuthorization(context: AssembleContextContext): ContextAuthorization {
    return {
      role: context.role,
      effectivePermissions: [...permissionsForRole(context.role)],
    };
  }

  private shouldIncludeSection(
    request: ContextRequest,
    capability: ContextCapabilityDefinition,
    section: ContextRequest['requestedSections'][number],
  ): boolean {
    return (
      request.requestedSections.includes(section) &&
      (capability.requiredSections.includes(section) ||
        capability.optionalSections.includes(section))
    );
  }

  private async runRequiredProvider(
    section: string,
    operation: () => Promise<readonly ContextContribution[]>,
  ): Promise<readonly ContextContribution[]> {
    try {
      return this.validateContributions(await operation(), section);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: `Required context provider "${section}" failed.`,
        cause: error,
      });
    }
  }

  private extractSingleContribution(
    contributions: readonly ContextContribution[],
    section: string,
  ): ContextContribution {
    if (contributions.length !== 1) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: `Required context provider "${section}" must return exactly one contribution.`,
        details: { count: contributions.length },
      });
    }

    return contributions[0]!;
  }

  private validateContributions(
    contributions: readonly ContextContribution[],
    section: string,
  ): readonly ContextContribution[] {
    return contributions.map((contribution, index) => {
      try {
        return validateContextContribution(contribution);
      } catch (error) {
        throw new ApplicationError({
          code: 'VALIDATION_FAILED',
          message: `Malformed context contribution from provider "${section}".`,
          cause: error,
          details: { index },
        });
      }
    });
  }
}

function sortContributions(
  contributions: readonly ContextContribution[],
): readonly ContextContribution[] {
  return [...contributions].sort((left, right) => {
    const contributorCompare = left.contributorId.localeCompare(right.contributorId);
    if (contributorCompare !== 0) {
      return contributorCompare;
    }

    const sectionCompare = left.section.localeCompare(right.section);
    if (sectionCompare !== 0) {
      return sectionCompare;
    }

    if (left.subject === null && right.subject === null) {
      return 0;
    }

    if (left.subject === null) {
      return -1;
    }

    if (right.subject === null) {
      return 1;
    }

    return compareEntityReferences(left.subject, right.subject);
  });
}

function formatProviderFailure(section: string, error: unknown): string {
  if (error instanceof ApplicationError) {
    return `${section}: ${error.message}`;
  }

  return `${section}: provider failed.`;
}
