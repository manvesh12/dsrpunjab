import type { PrismaClient, SystemSetting } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";
import type { UpdateSettingDto } from "./settings.dto.js";

export interface SettingsRepositoryContract {
  findByKey(key: string): Promise<SystemSetting | null>;
  upsert(input: UpdateSettingDto): Promise<SystemSetting>;
}

export class SettingsRepository implements SettingsRepositoryContract {
  constructor(private readonly database: PrismaClient) {}

  findByKey(key: string) {
    return this.database.systemSetting.findUnique({ where: { key } });
  }

  upsert({ key, value }: UpdateSettingDto) {
    return this.database.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

export const settingsRepository = new SettingsRepository(prisma);
