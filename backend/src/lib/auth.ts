// Compatibility exports for modules that have not yet switched import paths.
export type { AuthUser } from "../authentication/auth-user.js";
export { requireAuth } from "../authentication/authentication.middleware.js";
export { requireAnyRole } from "../authorization/authorization.middleware.js";
export { canAdmin, canReview, canUpload, permissionsFor, roleToFrontend } from "../authorization/role.policy.js";
export { tokenService as authTokenService } from "../authentication/token.service.js";

import type { AuthUser } from "../authentication/auth-user.js";
import { tokenService } from "../authentication/token.service.js";
export function signToken(user: AuthUser) { return tokenService.sign(user); }
