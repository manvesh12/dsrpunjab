import jwt, { type SignOptions } from "jsonwebtoken";
import { environment } from "../config/environment.js";
import type { AuthUser } from "./auth-user.js";

export class TokenService {
  sign(user: AuthUser) {
    return jwt.sign({ sub: String(user.id), role: user.role, username: user.username }, environment.jwtSecret, {
      expiresIn: environment.jwtExpiresIn as SignOptions["expiresIn"]
    });
  }
  subject(token: string) {
    const payload = jwt.verify(token, environment.jwtSecret) as { sub?: string };
    return payload.sub ? BigInt(payload.sub) : 0n;
  }
}

export const tokenService = new TokenService();
