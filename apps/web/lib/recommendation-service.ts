import {
  DailyBriefingService,
  GenerateRecommendationsUseCase,
  GetDailyBriefingSnapshotUseCase,
  GetMissionControlSnapshotUseCase,
  ListRecentOrganizationEventsUseCase,
  MissionControlService,
  RecommendationService,
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

const recommendationService = new RecommendationService(
  new GenerateRecommendationsUseCase({
    dailyBriefingSnapshotReader: dailyBriefingService,
  }),
);

/** Shared application-service composition root for deterministic recommendations. */
export function getRecommendationService(): RecommendationService {
  return recommendationService;
}
