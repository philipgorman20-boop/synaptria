import assert from 'node:assert/strict';
import test from 'node:test';

import { ContextAssemblerService } from './context-assembler-service';
import { AssembleContextUseCase } from './assemble-context';

test('ContextAssemblerService delegates to AssembleContextUseCase', async () => {
  const expected = { contextPackage: { packageId: 'package-1' } };
  const useCase = {
    async execute() {
      return expected;
    },
  };

  const service = new ContextAssemblerService(useCase as unknown as AssembleContextUseCase);
  const result = await service.assembleContext(
    {
      userId: 'user-1',
      organizationId: 'org-1',
      membershipId: 'membership-1',
      role: 'MEMBER',
      requestId: 'request-1',
      correlationId: 'correlation-1',
    } as never,
    {
      capabilityId: 'project.intelligence.v0',
      request: {
        primaryEntity: {
          organizationId: 'org-1',
          entityType: 'Project',
          entityId: 'project-1',
        },
        requestedSections: ['primaryEntity'],
      },
    } as never,
  );

  assert.equal(result, expected);
});
