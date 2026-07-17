import type { PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class AuthenticationRepository {
  constructor(private readonly database: PrismaClient) {}
  findUser(id: bigint) { return this.database.user.findUnique({ where: { id } }); }
}

export const authenticationRepository = new AuthenticationRepository(prisma);
