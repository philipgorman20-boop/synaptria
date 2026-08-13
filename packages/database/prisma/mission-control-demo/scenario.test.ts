import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMissionControlDemoScenario,
  summarizeMissionControlDemoScenario,
} from './scenario';

test('demo scenario defines the expected portfolio counts', () => {
  const scenario = buildMissionControlDemoScenario();

  assert.equal(scenario.programs.length, 3);
  assert.equal(scenario.projects.length, 6);
  assert.ok(scenario.milestones.length >= 12 && scenario.milestones.length <= 16);
  assert.ok(scenario.tasks.length >= 35 && scenario.tasks.length <= 50);
  assert.ok(scenario.events.length >= 10);
});

test('demo scenario covers required Mission Control state categories', () => {
  const scenario = buildMissionControlDemoScenario();
  const categories = new Set(
    [
      ...scenario.projects,
      ...scenario.milestones,
      ...scenario.tasks,
      ...scenario.events,
    ].map((entity) => entity.scenario),
  );

  assert.ok(categories.has('critical_at_risk'));
  assert.ok(categories.has('at_risk'));
  assert.ok(categories.has('watch'));
  assert.ok(categories.has('on_track'));
  assert.ok(categories.has('on_track_quiet'));
  assert.ok(categories.has('completed_project'));
  assert.ok(categories.has('deep_overdue_milestone'));
  assert.ok(categories.has('recent_overdue_milestone'));
  assert.ok(categories.has('due_soon_milestone'));
  assert.ok(categories.has('blocked_overdue_task'));
  assert.ok(categories.has('blocked_task'));
  assert.ok(categories.has('due_soon_critical_task'));
  assert.ok(categories.has('recent_activity'));
});

test('summarizeMissionControlDemoScenario returns sorted categories', () => {
  const scenario = buildMissionControlDemoScenario();
  const summary = summarizeMissionControlDemoScenario(scenario);
  assert.deepEqual(summary, [...summary].sort());
  assert.ok(summary.includes('critical_at_risk'));
});

test('demo entity ids remain unique within the scenario', () => {
  const scenario = buildMissionControlDemoScenario();
  const ids = [
    ...scenario.programs.map((item) => item.id),
    ...scenario.projects.map((item) => item.id),
    ...scenario.milestones.map((item) => item.id),
    ...scenario.tasks.map((item) => item.id),
    ...scenario.events.map((item) => item.id),
  ];

  assert.equal(new Set(ids).size, ids.length);
});
