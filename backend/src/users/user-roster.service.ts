import { usersRepository, type UsersRepositoryContract } from "./users.repository.js";
import { userSpreadsheetService, type UserSpreadsheetService } from "./user-spreadsheet.service.js";

export class UserRosterService {
  constructor(private readonly repository: UsersRepositoryContract, private readonly spreadsheets: UserSpreadsheetService) {}

  async export() {
    const [users, invitations] = await Promise.all([this.repository.exportUsers(), this.repository.pendingInvitations()]);
    return this.spreadsheets.exportRoster(users, invitations);
  }

  template() { return this.spreadsheets.invitationTemplate(); }
}

export const userRosterService = new UserRosterService(usersRepository, userSpreadsheetService);
