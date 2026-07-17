import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export class OtpService {
  generate() { return crypto.randomInt(100000, 1000000).toString(); }
  hash(otp: string, rounds = 10) { return bcrypt.hash(otp, rounds); }
  verify(otp: string, hash: string) { return bcrypt.compare(otp, hash); }
}

export const otpService = new OtpService();
