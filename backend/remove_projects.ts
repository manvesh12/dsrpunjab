import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { projectName: { contains: 'manvesh', mode: 'insensitive' } },
        { projectName: { contains: 'gurkirat', mode: 'insensitive' } }
      ]
    }
  });

  console.log('Found projects:', projects);

  for (const p of projects) {
    // Delete project members first to avoid foreign key constraints
    await prisma.projectMember.deleteMany({
      where: { projectId: p.id }
    });
    
    // Also delete any other relations if needed
    // (ReplenishmentStudy, Report, AuditLog, WorkflowHistory, Notification)
    // Prisma usually does this if cascading is on, but just in case:
    await prisma.replenishmentStudy.deleteMany({ where: { parentDsrId: p.id } });
    await prisma.report.deleteMany({ where: { projectId: p.id } });
    await prisma.auditLog.deleteMany({
      where: {
        metadata: { path: '$.projectId', equals: p.id.toString() }
      }
    });

    await prisma.project.delete({
      where: { id: p.id }
    });
    console.log(`Deleted project: ${p.projectName} (ID: ${p.id})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
