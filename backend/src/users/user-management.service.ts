import type { Prisma } from "@prisma/client";
import { passwordService, type PasswordService } from "../auth/security/password.service.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { usersRepository, type UsersRepositoryContract } from "./users.repository.js";
import { normalizeRole, requiresDistrict } from "./users.validator.js";

export class UserManagementService {
  constructor(private readonly repository: UsersRepositoryContract, private readonly passwords: PasswordService) {}

  list() { return this.repository.list(); }

  private async resolveDistrictId(value: unknown, role: string) {
    const raw = String(value || "").trim();
    if (!raw && requiresDistrict(role)) throw new ApiError(400, "DISTRICT_REQUIRED", "District is required for every non-admin account.");
    if (!raw || raw.toUpperCase() === "ALL") return null;
    if (/^\d+$/.test(raw)) return BigInt(raw);
    const d = await this.repository.findDistrictByName(raw);
    if (!d) throw new ApiError(400, "INVALID_DISTRICT", `District '${raw}' not found`);
    return d.id;
  }

  async create(body: any) {
    const email = String(body?.email || "").toLowerCase().trim();
    const username = String(body?.username || "").toLowerCase().trim();
    if (!email && !username) throw new ApiError(400, "INVALID_USER_DATA", "Email or username is required");
    const role = normalizeRole(body?.role);
    return this.repository.create({
      email,
      username: username || email,
      fullName: body?.fullName || username,
      password: await this.passwords.hash(String(body?.password || "")),
      role,
      districtId: await this.resolveDistrictId(body?.districtId || body?.district, role),
      blockName: body?.block || body?.blockName || "",
      sectionName: body?.section || body?.sectionName || "",
      accessScope: body?.accessScope || "",
      active: body?.active === undefined ? true : String(body.active) === "true"
    });
  }

  async update(id: bigint, body: any) {
    const current = await this.repository.find(id);
    if (!current) throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    const data: Prisma.UserUncheckedUpdateInput = {};
    if (body?.fullName !== undefined) data.fullName = body.fullName;
    if (body?.email !== undefined) data.email = body.email;
    if (body?.username !== undefined) data.username = body.username;
    if (body?.role !== undefined) data.role = normalizeRole(body.role);
    const targetRole = (data.role as typeof current.role | undefined) || current.role;
    if (body?.districtId !== undefined || body?.district !== undefined || requiresDistrict(targetRole)) {
      const distVal = body?.districtId !== undefined ? body.districtId : (body?.district !== undefined ? body.district : current.districtId);
      data.districtId = await this.resolveDistrictId(distVal, targetRole);
    }
    if (body?.block !== undefined || body?.blockName !== undefined) data.blockName = body.block || body.blockName || "";
    if (body?.section !== undefined || body?.sectionName !== undefined) data.sectionName = body.section || body.sectionName || "";
    if (body?.accessScope !== undefined) data.accessScope = body.accessScope;
    if (body?.password) data.password = await this.passwords.hash(String(body.password));
    return this.repository.update(id, data);
  }

  setActive(id: bigint, active: unknown) { return this.repository.update(id, { active: Boolean(active) }); }

  async delete(id: bigint) {
    await this.repository.delete(id);
    return { success: true };
  }
}

export const userManagementService = new UserManagementService(usersRepository, passwordService);
