import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log("Starting database cleanup...");

    // 1. Delete all projects (Cascade should handle related files, sections, audits, replenishments)
    const projectDeleteResult = await prisma.project.deleteMany({});
    console.log(`Deleted ${projectDeleteResult.count} projects (and all related DSR data).`);

    // 2. Delete all Model DSRs (Templates) just in case there's demo templates
    const modelDeleteResult = await prisma.modelDsr.deleteMany({});
    console.log(`Deleted ${modelDeleteResult.count} Model DSR templates.`);

    // 3. Delete all users EXCEPT the 'super.admin'
    const superAdmin = await prisma.user.findUnique({
      where: { username: 'super.admin' }
    });

    if (superAdmin) {
      const userDeleteResult = await prisma.user.deleteMany({
        where: {
          NOT: {
            id: superAdmin.id
          }
        }
      });
      console.log(`Deleted ${userDeleteResult.count} demo users.`);
      console.log(`Kept 1 user: super.admin`);
    } else {
      console.warn("WARNING: super.admin not found! Did not delete other users to prevent lockout.");
    }

    console.log("Database cleanup completed successfully! Ready for Beta launch.");
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
