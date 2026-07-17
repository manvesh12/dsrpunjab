import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  console.log("Total users in DB:", userCount);
  const users = await prisma.user.findMany({
    select: {
      username: true,
      email: true,
      role: true,
      active: true
    }
  });
  console.log("Users:", JSON.stringify(users, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
