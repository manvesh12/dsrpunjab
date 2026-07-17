import bcrypt from "bcryptjs";
import { ApiError } from "../../common/exceptions/api-error.js";

export class PasswordService {
  validate(password: string) {
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new ApiError(400, "PASSWORD_POLICY_FAILED", "Password must be at least 10 characters and include letters and numbers");
    }
  }

  hash(password: string, rounds = 10) {
    this.validate(password);
    return bcrypt.hash(password, rounds);
  }

  verify(value: string, hash: string) { return bcrypt.compare(value, hash); }
}

export const passwordService = new PasswordService();
