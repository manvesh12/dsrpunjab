export type UpdateSettingDto = {
  key: string;
  value: string;
};

export type DefaultSettingDto = {
  key: string;
  value: string;
  updatedAt: null;
  degraded?: true;
};
