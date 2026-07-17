import { healthRepository, type HealthRepositoryContract } from "./health.repository.js";

export class HealthService {
  constructor(private readonly repository: HealthRepositoryContract) {}
  health() { return { ok: true }; }
  live() { return { status: "up" }; }
  async ready() {
    await this.repository.checkDatabase();
    return { status: "ready", db: "ok", redis: "ok" };
  }
}

export const healthService = new HealthService(healthRepository);
