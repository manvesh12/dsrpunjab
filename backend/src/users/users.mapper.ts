import type { User } from "@prisma/client";
import { permissionsFor } from "../authorization/role.policy.js";

export function toUserDto(user: User) {
  return {
    id: Number(user.id),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    district: user.districtId ? String(user.districtId) : "",
    block: user.blockName || "",
    blockName: user.blockName || "",
    section: user.sectionName || "",
    sectionName: user.sectionName || "",
    accessLabel: user.accessScope || user.role.replaceAll("_", " "),
    permissions: permissionsFor(user.role),
    active: user.active,
    createdAt: user.createdAt.toISOString()
  };
}
