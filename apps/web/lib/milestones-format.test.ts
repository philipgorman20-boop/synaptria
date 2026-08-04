import assert from 'node:assert/strict';
import test from 'node:test';

import { milestoneRoute, newMilestoneRoute, projectMilestonesRoute } from '@synaptria/config';
import { milestoneId, projectId } from '@synaptria/core';
import type { Milestone } from '@synaptria/domain/milestones';
import { organizationId } from '@synaptria/core';

import {
  buildMilestoneDetailBreadcrumbLinks,
  formatMilestoneDate,
  formatMilestoneDateInputValue,
  formatMilestonePriority,
  formatMilestoneStatus,
  formatOptionalMilestoneDate,
  getMilestoneDetailHref,
  getNewMilestoneHref,
  getProjectDetailHrefFromMilestones,
  getProjectMilestonesListHref,
  parseMilestoneRouteParam,
  parseProjectRouteParamForMilestones,
  shouldShowCreateMilestoneControl,
} from './milestones-format';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';
const NOW = new Date('2026-08-15T12:00:00.000Z');

test('formatMilestoneStatus returns readable labels', () => {
  assert.equal(formatMilestoneStatus('PLANNED'), 'Planned');
  assert.equal(formatMilestoneStatus('IN_PROGRESS'), 'In progress');
  assert.equal(formatMilestoneStatus('BLOCKED'), 'Blocked');
});

test('formatMilestonePriority returns readable labels', () => {
  assert.equal(formatMilestonePriority('CRITICAL'), 'Critical');
});

test('formatMilestoneDate uses the configured locale', () => {
  assert.match(formatMilestoneDate(NOW), /Aug/);
});

test('formatOptionalMilestoneDate renders an em dash when absent', () => {
  assert.equal(formatOptionalMilestoneDate(undefined), '—');
  assert.match(formatOptionalMilestoneDate(NOW), /Aug/);
});

test('shouldShowCreateMilestoneControl follows manage permission', () => {
  assert.equal(shouldShowCreateMilestoneControl(true), true);
  assert.equal(shouldShowCreateMilestoneControl(false), false);
});

test('parseProjectRouteParamForMilestones accepts valid UUID project identifiers', () => {
  assert.equal(
    parseProjectRouteParamForMilestones(PROJECT_UUID),
    projectId(PROJECT_UUID),
  );
});

test('parseMilestoneRouteParam accepts valid UUID milestone identifiers', () => {
  assert.equal(
    parseMilestoneRouteParam(MILESTONE_UUID),
    milestoneId(MILESTONE_UUID),
  );
});

test('getMilestoneDetailHref builds the milestone detail route', () => {
  assert.equal(
    getMilestoneDetailHref(projectId(PROJECT_UUID), milestoneId(MILESTONE_UUID)),
    milestoneRoute(PROJECT_UUID, MILESTONE_UUID),
  );
});

test('getProjectMilestonesListHref builds the project milestones list route', () => {
  assert.equal(
    getProjectMilestonesListHref(projectId(PROJECT_UUID)),
    projectMilestonesRoute(PROJECT_UUID),
  );
});

test('getNewMilestoneHref builds the milestone create route', () => {
  assert.equal(
    getNewMilestoneHref(projectId(PROJECT_UUID)),
    newMilestoneRoute(PROJECT_UUID),
  );
});

test('getProjectDetailHrefFromMilestones builds the parent project route', () => {
  assert.equal(
    getProjectDetailHrefFromMilestones(projectId(PROJECT_UUID)),
    `/projects/${PROJECT_UUID}`,
  );
});

test('formatMilestoneDateInputValue preserves ISO date input values', () => {
  assert.equal(formatMilestoneDateInputValue('2026-08-15'), '2026-08-15');
});

test('buildMilestoneDetailBreadcrumbLinks includes milestone label when provided', () => {
  const links = buildMilestoneDetailBreadcrumbLinks({
    projectId: projectId(PROJECT_UUID),
    projectName: 'Lead Candidate Study',
    milestoneName: 'Phase 1 Gate',
  });

  assert.equal(links.milestoneLabel, 'Phase 1 Gate');
});

test('milestone list rows expose navigation links for populated lists', () => {
  const milestone = milestoneFixture();
  const href = getMilestoneDetailHref(milestone.projectId, milestone.id);

  assert.equal(
    href,
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}`,
  );
});

function milestoneFixture(): Milestone {
  return {
    id: milestoneId(MILESTONE_UUID),
    organizationId: organizationId('org-1'),
    projectId: projectId(PROJECT_UUID),
    name: 'Phase 1 Gate',
    status: 'PLANNED',
    priority: 'HIGH',
    plannedEndDate: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  };
}
