import { apiClient } from "./client";

/** Generic key-value system setting from backend */
export interface SystemSetting {
  key: string;
  value: string;
  updatedAt: string;
}

/** Known setting keys used by the portal */
export type SettingKey =
  | "notice_text"
  | "announcements"
  | "portal_name"
  | "contact_email"
  | "contact_phone"
  | "maintenance_mode"
  | string;

export const settingsApi = {
  /** Get a setting by key */
  get: async (key: SettingKey): Promise<SystemSetting> => {
    const { data } = await apiClient.get<SystemSetting>(`/settings/${key}`);
    return data;
  },

  /** Update a setting by key (requires SUPER_ADMIN or STATE_ADMIN) */
  update: async (key: SettingKey, value: string): Promise<SystemSetting> => {
    const { data } = await apiClient.put<SystemSetting>(`/settings/${key}`, { value });
    return data;
  },

  /** Fetch multiple settings in parallel */
  getMultiple: async (keys: SettingKey[]): Promise<Record<string, string>> => {
    const results = await Promise.allSettled(
      keys.map((key) => settingsApi.get(key))
    );
    const record: Record<string, string> = {};
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        record[keys[i]] = result.value.value;
      }
    });
    return record;
  },
};
