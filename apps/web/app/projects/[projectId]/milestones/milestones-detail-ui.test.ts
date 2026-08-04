import assert from 'node:assert/strict';
import test from 'node:test';

import { milestoneId, projectId } from '@synaptria/core';

import {
  buildMilestoneDetailBreadcrumbLinks,
  formatMilestoneDateInputValue,
  getMilestoneDetailHref,
  getNewMilestoneHref,
  getProjectMilestonesListHref,
} from '../../../../lib/milestones-format';
import {
  MILESTONE_DETAIL_ERROR_HEADING,
  MILESTONE_DETAIL_ERROR_ROLE,
} from './[milestoneId]/error';
import {
  MILESTONE_DETAIL_LOADING_LABEL,
} from './[milestoneId]/loading';
import {
  MILESTONE_DETAIL_METADATA_HEADING,
  MILESTONE_READ_ONLY_NOTICE,
} from './[milestoneId]/components/milestone-detail-metadata';
import {
  CREATE_MILESTONE_ERROR_HEADING,
  CREATE_MILESTONE_ERROR_ROLE,
} from './new/error';
import { CREATE_MILESTONE_LOADING_LABEL } from './new/loading';
import {
  CREATE_MILESTONE_FORM_HEADING,
  resolveCreateMilestoneFormValues,
} from './new/components/create-milestone-form';
import { CREATE_MILESTONE_PAGE_TITLE } from './new/components/create-milestone-page-header';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';

test('buildMilestoneDetailBreadcrumbLinks builds project and milestone list navigation', () => {
  const links = buildMilestoneDetailBreadcrumbLinks({
    projectId: projectId(PROJECT_UUID),
    projectName: 'Lead Candidate Study',
    milestoneName: 'Phase 1 Gate',
  });

  assert.equal(links.projectHref, `/projects/${PROJECT_UUID}`);
  assert.equal(links.projectLabel, 'Lead Candidate Study');
  assert.equal(links.milestonesHref, `/projects/${PROJECT_UUID}/milestones`);
  assert.equal(links.milestoneLabel, 'Phase 1 Gate');
});

test('create milestone page links to the expected routes', () => {
  assert.equal(
    getNewMilestoneHref(projectId(PROJECT_UUID)),
    `/projects/${PROJECT_UUID}/milestones/new`,
  );
  assert.equal(
    getProjectMilestonesListHref(projectId(PROJECT_UUID)),
    `/projects/${PROJECT_UUID}/milestones`,
  );
});

test('formatMilestoneDateInputValue preserves ISO date input values', () => {
  assert.equal(formatMilestoneDateInputValue('2026-08-15'), '2026-08-15');
  assert.equal(formatMilestoneDateInputValue(''), '');
});

test('resolveCreateMilestoneFormValues restores submitted values after validation failures', () => {
  const values = resolveCreateMilestoneFormValues(
    {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      values: {
        projectId: PROJECT_UUID,
        name: 'Phase 1 Gate',
        description: 'Initial review',
        status: 'PLANNED',
        priority: 'HIGH',
        plannedStartDate: '2026-08-01',
        plannedEndDate: '2026-08-31',
        actualStartDate: '',
        actualEndDate: '',
      },
    },
    projectId(PROJECT_UUID),
  );

  assert.equal(values.name, 'Phase 1 Gate');
  assert.equal(values.description, 'Initial review');
  assert.equal(values.plannedStartDate, '2026-08-01');
});

test('milestone detail metadata is read-only pending update use cases', () => {
  assert.equal(MILESTONE_DETAIL_METADATA_HEADING, 'Milestone details');
  assert.match(MILESTONE_READ_ONLY_NOTICE, /read-only/i);
});

test('create and detail pages expose loading and error semantics', () => {
  assert.equal(CREATE_MILESTONE_LOADING_LABEL, 'Loading milestone create form');
  assert.equal(CREATE_MILESTONE_ERROR_ROLE, 'alert');
  assert.equal(CREATE_MILESTONE_ERROR_HEADING, 'Create milestone unavailable');
  assert.equal(MILESTONE_DETAIL_LOADING_LABEL, 'Loading milestone details');
  assert.equal(MILESTONE_DETAIL_ERROR_ROLE, 'alert');
  assert.equal(MILESTONE_DETAIL_ERROR_HEADING, 'Milestone unavailable');
});

test('create and detail page headings are defined', () => {
  assert.equal(CREATE_MILESTONE_PAGE_TITLE, 'Create milestone');
  assert.equal(CREATE_MILESTONE_FORM_HEADING, 'Create a milestone');
});

test('milestone detail route matches list row navigation', () => {
  assert.equal(
    getMilestoneDetailHref(projectId(PROJECT_UUID), milestoneId(MILESTONE_UUID)),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}`,
  );
});
