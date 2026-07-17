import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanOldData() {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        createdAt: true,
      }
    });

    console.log("=== CURRENT USERS IN DB ===");
    allUsers.forEach(u => {
      console.log(`ID: ${u.id} | User: ${u.username} | Name: ${u.fullName} | Created: ${u.createdAt}`);
    });

    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        projectName: true,
        projectCode: true,
      }
    });

    console.log("\n=== CURRENT PROJECTS IN DB ===");
    allProjects.forEach(p => {
      console.log(`ID: ${p.id} | Name: ${p.projectName} | Code: ${p.projectCode}`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOldData();
