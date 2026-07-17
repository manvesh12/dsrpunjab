import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findFirst({ orderBy: { id: 'desc' } });
  if(p && p.projectState) {
    const s = JSON.parse(p.projectState);
    console.log("frontMatter:", s.frontMatter);
    console.log("chapter 1:", s.chapters[0]);
  }
}
main();
