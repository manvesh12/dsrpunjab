import { Router } from "express";
import { authController } from "./auth.controller.js";

export const authRouter = Router();
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/register", authController.registerDisabled);
authRouter.post("/verify-register-otp", authController.verifyRegisterOtp);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/forgot-password/resend", authController.forgotPassword);
authRouter.post("/verify-reset-otp", authController.verifyResetOtp);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.get("/invitation/:token", authController.invitationDetails);
authRouter.post("/register-invited", authController.registerInvited);
authRouter.post("/verify-invited-otp", authController.verifyInvitedOtp);
authRouter.post("/resend-invited-otp", authController.resendInvitedOtp);
