import assert from 'node:assert/strict';
import test from 'node:test';

import { milestoneId, projectId, taskId } from '@synaptria/core';

import {
  buildTaskDetailBreadcrumbLinks,
  formatTaskDateInputValue,
  getMilestoneTasksListHref,
  getNewTaskHref,
  getTaskDetailHref,
} from '../../../../../../lib/tasks-format';
import {
  TASK_DETAIL_ERROR_HEADING,
  TASK_DETAIL_ERROR_ROLE,
} from './[taskId]/error';
import { TASK_DETAIL_LOADING_LABEL } from './[taskId]/loading';
import {
  TASK_DETAIL_METADATA_HEADING,
  TASK_READ_ONLY_NOTICE,
} from './[taskId]/components/task-detail-metadata';
import {
  CREATE_TASK_ERROR_HEADING,
  CREATE_TASK_ERROR_ROLE,
} from './new/error';
import { CREATE_TASK_LOADING_LABEL } from './new/loading';
import {
  CREATE_TASK_FORM_HEADING,
  resolveCreateTaskFormValues,
} from './new/components/create-task-form';
import { CREATE_TASK_PAGE_TITLE } from './new/components/create-task-page-header';

const PROJECT_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MILESTONE_UUID = '660e8400-e29b-41d4-a716-446655440001';
const TASK_UUID = '770e8400-e29b-41d4-a716-446655440002';

test('buildTaskDetailBreadcrumbLinks builds project, milestone, and task list navigation', () => {
  const links = buildTaskDetailBreadcrumbLinks({
    projectId: projectId(PROJECT_UUID),
    projectName: 'Lead Candidate Study',
    milestoneId: milestoneId(MILESTONE_UUID),
    milestoneName: 'Phase 1 Gate',
    taskName: 'Prepare assay protocol',
  });

  assert.equal(links.projectHref, `/projects/${PROJECT_UUID}`);
  assert.equal(links.projectLabel, 'Lead Candidate Study');
  assert.equal(links.milestonesHref, `/projects/${PROJECT_UUID}/milestones`);
  assert.equal(links.milestoneHref, `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}`);
  assert.equal(links.milestoneLabel, 'Phase 1 Gate');
  assert.equal(links.tasksHref, `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks`);
  assert.equal(links.taskLabel, 'Prepare assay protocol');
});

test('create task page links to the expected routes', () => {
  assert.equal(
    getNewTaskHref(projectId(PROJECT_UUID), milestoneId(MILESTONE_UUID)),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks/new`,
  );
  assert.equal(
    getMilestoneTasksListHref(projectId(PROJECT_UUID), milestoneId(MILESTONE_UUID)),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks`,
  );
});

test('formatTaskDateInputValue preserves ISO date input values', () => {
  assert.equal(formatTaskDateInputValue('2026-08-15'), '2026-08-15');
  assert.equal(formatTaskDateInputValue(''), '');
});

test('resolveCreateTaskFormValues restores submitted values after validation failures', () => {
  const values = resolveCreateTaskFormValues({
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    values: {
      name: 'Prepare assay protocol',
      description: 'Initial draft',
      status: 'TODO',
      priority: 'HIGH',
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-31',
      actualStartDate: '',
      actualEndDate: '',
    },
  });

  assert.equal(values.name, 'Prepare assay protocol');
  assert.equal(values.description, 'Initial draft');
  assert.equal(values.plannedStartDate, '2026-08-01');
});

test('task detail metadata is read-only pending update use cases', () => {
  assert.equal(TASK_DETAIL_METADATA_HEADING, 'Task details');
  assert.match(TASK_READ_ONLY_NOTICE, /read-only/i);
});

test('create and detail pages expose loading and error semantics', () => {
  assert.equal(CREATE_TASK_LOADING_LABEL, 'Loading task create form');
  assert.equal(CREATE_TASK_ERROR_ROLE, 'alert');
  assert.equal(CREATE_TASK_ERROR_HEADING, 'Create task unavailable');
  assert.equal(TASK_DETAIL_LOADING_LABEL, 'Loading task details');
  assert.equal(TASK_DETAIL_ERROR_ROLE, 'alert');
  assert.equal(TASK_DETAIL_ERROR_HEADING, 'Task unavailable');
});

test('create and detail page headings are defined', () => {
  assert.equal(CREATE_TASK_PAGE_TITLE, 'Create task');
  assert.equal(CREATE_TASK_FORM_HEADING, 'Create a task');
});

test('task detail route matches list row navigation', () => {
  assert.equal(
    getTaskDetailHref(
      projectId(PROJECT_UUID),
      milestoneId(MILESTONE_UUID),
      taskId(TASK_UUID),
    ),
    `/projects/${PROJECT_UUID}/milestones/${MILESTONE_UUID}/tasks/${TASK_UUID}`,
  );
});
