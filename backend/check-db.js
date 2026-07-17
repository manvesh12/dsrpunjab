const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findFirst({ orderBy: { id: 'desc' } });
  if(p && p.projectState) {
    const s = JSON.parse(p.projectState);
    console.log("Has imported chapters?", !!s.importedChapters);
    console.log("Has backup?", !!s.__backup);
    if(s.__backup) {
      console.log("Backup has chapters?", !!s.__backup.chapters);
      console.log("Backup has frontMatter?", !!s.__backup.frontMatter);
    }
  } else {
    console.log("No project state");
  }
}
main();
