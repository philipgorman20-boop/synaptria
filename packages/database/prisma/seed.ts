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

  const company = await prisma.company.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'Example Biotech',
      },
    },
    update: {
      type: 'PROSPECT',
      status: 'ACTIVE',
      industry: 'Biotechnology',
      website: 'https://example.com',
      notes: 'Seeded CRM demonstration company.',
    },
    create: {
      organizationId: organization.id,
      name: 'Example Biotech',
      type: 'PROSPECT',
      status: 'ACTIVE',
      industry: 'Biotechnology',
      website: 'https://example.com',
      city: 'New Haven',
      stateProvince: 'Connecticut',
      country: 'United States',
      notes: 'Seeded CRM demonstration company.',
    },
  });

  const contact = await prisma.contact.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'jane.doe@example.com',
      },
    },
    update: {
      companyId: company.id,
      firstName: 'Jane',
      lastName: 'Doe',
      title: 'Vice President, Research',
    },
    create: {
      organizationId: organization.id,
      companyId: company.id,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      title: 'Vice President, Research',
      department: 'Research and Development',
    },
  });

  const opportunity = await prisma.opportunity.upsert({
    where: {
      id: 'seed-opportunity-antibody-discovery',
    },
    update: {
      organizationId: organization.id,
      companyId: company.id,
      contactId: contact.id,
      ownerId: user.id,
      name: 'Antibody Discovery Program',
      stage: 'DISCOVERY',
      amountCents: 12500000,
      currency: 'USD',
      probability: 40,
    },
    create: {
      id: 'seed-opportunity-antibody-discovery',
      organizationId: organization.id,
      companyId: company.id,
      contactId: contact.id,
      ownerId: user.id,
      name: 'Antibody Discovery Program',
      stage: 'DISCOVERY',
      amountCents: 12500000,
      currency: 'USD',
      probability: 40,
      description:
        'Example antibody discovery and characterization opportunity.',
    },
  });

  const project = await prisma.project.upsert({
    where: {
      id: 'seed-project-antibody-discovery',
    },
    update: {
      organizationId: organization.id,
      companyId: company.id,
      opportunityId: opportunity.id,
      name: 'Example Antibody Discovery Project',
      status: 'PLANNED',
    },
    create: {
      id: 'seed-project-antibody-discovery',
      organizationId: organization.id,
      companyId: company.id,
      opportunityId: opportunity.id,
      name: 'Example Antibody Discovery Project',
      description:
        'Seeded project connecting CRM and project-management records.',
      status: 'PLANNED',
    },
  });

  await prisma.activity.upsert({
    where: {
      id: 'seed-activity-discovery-call',
    },
    update: {
      organizationId: organization.id,
      companyId: company.id,
      contactId: contact.id,
      opportunityId: opportunity.id,
      projectId: project.id,
      createdById: user.id,
      assignedToId: user.id,
      type: 'MEETING',
      status: 'COMPLETED',
      priority: 'HIGH',
      subject: 'Initial discovery call',
      body: 'Discuss target profile, campaign scope, and desired timeline.',
    },
    create: {
      id: 'seed-activity-discovery-call',
      organizationId: organization.id,
      companyId: company.id,
      contactId: contact.id,
      opportunityId: opportunity.id,
      projectId: project.id,
      createdById: user.id,
      assignedToId: user.id,
      type: 'MEETING',
      status: 'COMPLETED',
      priority: 'HIGH',
      subject: 'Initial discovery call',
      body: 'Discuss target profile, campaign scope, and desired timeline.',
      occurredAt: new Date(),
      completedAt: new Date(),
    },
  });

  console.log('Database seed completed successfully.');
  console.log({
    user: user.email,
    organization: organization.slug,
    company: company.name,
    contact: contact.email,
    opportunity: opportunity.name,
    project: project.name,
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
