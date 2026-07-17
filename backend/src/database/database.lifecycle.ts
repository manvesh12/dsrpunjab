import { prisma } from "./prisma.client.js";

export function disconnectDatabase() {
  return prisma.$disconnect();
}
