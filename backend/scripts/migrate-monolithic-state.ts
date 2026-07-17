import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting state migration...");
  const projects = await prisma.project.findMany({
    where: { projectState: { not: null } }
  });

  for (const project of projects) {
    if (!project.projectState) continue;
    try {
      const state = typeof project.projectState === 'string' ? JSON.parse(project.projectState) : project.projectState;
      
      console.log(`Migrating project ${project.id}...`);
      
      // Save entire state as a draft initially
      await prisma.projectDraft.upsert({
        where: { projectId: project.id },
        create: { projectId: project.id, draftContent: state },
        update: { draftContent: state }
      });
      
      // Break down sections
      const sectionsToCreate = [];
      for (const key of Object.keys(state)) {
        // e.g. frontMatter, chapters, plates, etc.
        const content = state[key];
        if (content) {
          sectionsToCreate.push({
            projectId: project.id,
            sectionName: key,
            content: content,
            version: 1,
            status: 'DRAFT'
          });
        }
      }

      for (const sec of sectionsToCreate) {
        await prisma.projectSection.upsert({
          where: { projectId_sectionName: { projectId: sec.projectId, sectionName: sec.sectionName } },
          create: sec,
          update: sec
        });
      }

      console.log(`Successfully migrated project ${project.id}`);
    } catch (err) {
      console.error(`Failed to migrate project ${project.id}`, err);
    }
  }

  console.log("Migration complete!");
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
