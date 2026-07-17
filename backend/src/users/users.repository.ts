import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class UsersRepository {
  constructor(private readonly database: PrismaClient) {}

  list() { return this.database.user.findMany({ orderBy: { createdAt: "desc" } }); }
  exportUsers() { return this.database.user.findMany({ orderBy: [{ districtId: "asc" }, { email: "asc" }] }); }
  pendingInvitations() {
    return this.database.invitation.findMany({ where: { status: { not: "REGISTERED" } }, orderBy: [{ district: "asc" }, { email: "asc" }] });
  }
  create(data: Prisma.UserUncheckedCreateInput) { return this.database.user.create({ data }); }
  find(id: bigint) { return this.database.user.findUnique({ where: { id } }); }
  findByEmail(email: string) { return this.database.user.findUnique({ where: { email } }); }
  findByMobile(mobileNumber: string) { return this.database.user.findUnique({ where: { mobileNumber } }); }
  update(id: bigint, data: Prisma.UserUncheckedUpdateInput) { return this.database.user.update({ where: { id }, data }); }
  delete(id: bigint) { return this.database.user.delete({ where: { id } }); }
  findInvitation(email: string) { return this.database.invitation.findUnique({ where: { email } }); }
  upsertInvitation(email: string, create: Prisma.InvitationUncheckedCreateInput, update: Prisma.InvitationUncheckedUpdateInput) {
    return this.database.invitation.upsert({ where: { email }, create, update });
  }
  updateInvitation(id: string, data: Prisma.InvitationUncheckedUpdateInput) {
    return this.database.invitation.update({ where: { id }, data });
  }
  findDistrictByName(name: string) {
    return this.database.district.findFirst({ where: { name } });
  }
}

export type UsersRepositoryContract = Pick<
  UsersRepository,
  "list" | "exportUsers" | "pendingInvitations" | "create" | "find" | "findByEmail" | "findByMobile" | "update" | "delete" | "findInvitation" | "upsertInvitation" | "updateInvitation" | "findDistrictByName"
>;

export const usersRepository = new UsersRepository(prisma);
