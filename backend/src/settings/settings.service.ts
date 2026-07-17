import { ApiError } from "../common/exceptions/api-error.js";
import { logger } from "../common/logging/logger.js";
import { DEFAULT_SETTINGS } from "./settings.constants.js";
import type { DefaultSettingDto, UpdateSettingDto } from "./settings.dto.js";
import { settingsRepository, type SettingsRepositoryContract } from "./settings.repository.js";

export class SettingsService {
  constructor(private readonly repository: SettingsRepositoryContract) {}

  async getByKey(key: string) {
    try {
      const setting = await this.repository.findByKey(key);
      if (setting) return setting;
      const fallback = this.defaultSetting(key);
      if (fallback) return fallback;
      throw new ApiError(404, "SETTING_NOT_FOUND", "Setting not found");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error("setting_read_failed", { key, error: error instanceof Error ? error.message : String(error) });
      const fallback = this.defaultSetting(key, true);
      if (fallback) return fallback;
      throw new ApiError(500, "SETTING_READ_FAILED", "Failed to fetch setting");
    }
  }

  update(input: UpdateSettingDto) {
    return this.repository.upsert(input).catch((error) => {
      logger.error("setting_update_failed", { key: input.key, error: error instanceof Error ? error.message : String(error) });
      throw new ApiError(500, "SETTING_UPDATE_FAILED", "Failed to update setting");
    });
  }

  private defaultSetting(key: string, degraded = false): DefaultSettingDto | null {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return null;
    return { key, value: DEFAULT_SETTINGS[key], updatedAt: null, ...(degraded ? { degraded: true as const } : {}) };
  }
}

export const settingsService = new SettingsService(settingsRepository);
