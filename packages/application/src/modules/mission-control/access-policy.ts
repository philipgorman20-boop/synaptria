import type { OrganizationRole } from '@synaptria/core/context';
import { hasPermission, PERMISSIONS } from '@synaptria/permissions';

export interface MissionControlAccessPolicy {
  canAccessDashboard(role: OrganizationRole): boolean;
  canReadPrograms(role: OrganizationRole): boolean;
  canReadProjects(role: OrganizationRole): boolean;
  canReadMilestones(role: OrganizationRole): boolean;
  canReadTasks(role: OrganizationRole): boolean;
  canReadRecentActivity(role: OrganizationRole): boolean;
}

export function createDefaultMissionControlAccessPolicy(): MissionControlAccessPolicy {
  return {
    canAccessDashboard(role) {
      return hasPermission(role, PERMISSIONS.DASHBOARD_READ);
    },
    canReadPrograms(role) {
      return hasPermission(role, PERMISSIONS.PROGRAMS_READ);
    },
    canReadProjects(role) {
      return hasPermission(role, PERMISSIONS.PROJECTS_READ);
    },
    canReadMilestones(role) {
      return hasPermission(role, PERMISSIONS.MILESTONES_READ);
    },
    canReadTasks(role) {
      return hasPermission(role, PERMISSIONS.TASKS_READ);
    },
    canReadRecentActivity(role) {
      return hasPermission(role, PERMISSIONS.ORGANIZATION_READ);
    },
  };
}
