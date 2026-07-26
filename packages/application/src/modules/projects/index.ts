export * from './create-project';
export * from './get-project';
export * from './list-program-projects';
export * from './list-projects';
export * from './project-service';
export * from './project-unit-of-work';

/** Public application-layer identifier for the Projects module. */
export const projectsModule = 'projects' as const;
