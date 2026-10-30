import {
  DailyBriefingService,
  GetDailyBriefingSnapshotUseCase,
  GetMissionControlSnapshotUseCase,
  ListRecentOrganizationEventsUseCase,
  MissionControlService,
} from '@synaptria/application';
import { SystemClock } from '@synaptria/core';
import { createPersistenceRepositories, db } from '@synaptria/database';

const repositories = createPersistenceRepositories(db);
const clock = new SystemClock();

const listRecentOrganizationEvents = new ListRecentOrganizationEventsUseCase(
  repositories.events,
);

const missionControlService = new MissionControlService(
  new GetMissionControlSnapshotUseCase({
    programs: repositories.programs,
    projects: repositories.projects,
    milestones: repositories.milestones,
    tasks: repositories.tasks,
    listRecentOrganizationEvents,
    clock,
  }),
);

const dailyBriefingService = new DailyBriefingService(
  new GetDailyBriefingSnapshotUseCase({
    missionControl: missionControlService,
    listRecentOrganizationEvents,
    clock,
  }),
);

/** Shared application-service composition root for Daily Briefing. */
export function getDailyBriefingService(): DailyBriefingService {
  return dailyBriefingService;
}
