import {
  GetMissionControlSnapshotUseCase,
  ListRecentOrganizationEventsUseCase,
  MissionControlService,
} from '@synaptria/application';
import { SystemClock } from '@synaptria/core';
import { createPersistenceRepositories, db } from '@synaptria/database';

const repositories = createPersistenceRepositories(db);
const clock = new SystemClock();

const missionControlService = new MissionControlService(
  new GetMissionControlSnapshotUseCase({
    programs: repositories.programs,
    projects: repositories.projects,
    milestones: repositories.milestones,
    tasks: repositories.tasks,
    listRecentOrganizationEvents: new ListRecentOrganizationEventsUseCase(
      repositories.events,
    ),
    clock,
  }),
);

/** Shared application-service composition root for Mission Control. */
export function getMissionControlService(): MissionControlService {
  return missionControlService;
}
