import { ApiError } from "../common/exceptions/api-error.js";
import type { UpdateSettingDto } from "./settings.dto.js";

export function validateUpdateSetting(key: string, body: unknown): UpdateSettingDto {
  const value = (body as { value?: string } | null | undefined)?.value;
  if (value === undefined) throw new ApiError(400, "SETTING_VALUE_REQUIRED", "Value is required");
  return { key, value };
}
