import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const user = await prisma.user.upsert({
    where: {
      email: 'philip.gorman20@gmail.com',
    },
    update: {
      name: 'Philip Gorman',
      displayName: 'Philip Gorman',
    },
    create: {
      email: 'philip.gorman20@gmail.com',
      name: 'Philip Gorman',
      displayName: 'Philip Gorman',
    },
  });

  const organization = await prisma.organization.upsert({
    where: {
      slug: 'synaptria',
    },
    update: {
      name: 'Synaptria',
    },
    create: {
      name: 'Synaptria',
      slug: 'synaptria',
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: {
      role: 'OWNER',
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  const team = await prisma.team.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'Leadership',
      },
    },
    update: {
      description: 'Synaptria leadership and platform administrators',
    },
    create: {
      organizationId: organization.id,
      name: 'Leadership',
      description: 'Synaptria leadership and platform administrators',
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: user.id,
    },
  });

  console.log('Database seed completed successfully.');
  console.log({
    user: user.email,
    organization: organization.slug,
    team: team.name,
  });
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
