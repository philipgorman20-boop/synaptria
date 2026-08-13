import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  countMissionControlDemoRecords,
  seedMissionControlDemo,
} from './mission-control-demo/seed';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

dotenv.config({
  path: path.resolve(currentDirectory, '../../../.env'),
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Expected it in the repository root .env file.',
  );
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const organization = await prisma.organization.findFirst({
    where: { slug: 'synaptria', deletedAt: null },
    select: { id: true, slug: true, name: true },
  });

  if (organization === null) {
    throw new Error('Synaptria organization not found. Run pnpm db:seed first.');
  }

  const summary = await seedMissionControlDemo(prisma);
  const counts = await countMissionControlDemoRecords(prisma, organization.id);

  console.log('Mission Control demo seed completed successfully.');
  console.log({
    organization: summary.organizationSlug,
    programsCreated: summary.programsCreated,
    projectsCreated: summary.projectsCreated,
    milestonesCreated: summary.milestonesCreated,
    tasksCreated: summary.tasksCreated,
    eventsCreated: summary.eventsCreated,
    scenarioCategories: summary.scenarioCategories,
    persistedCounts: counts,
  });
}

main()
  .catch((error: unknown) => {
    console.error('Mission Control demo seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
