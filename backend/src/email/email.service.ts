import { logger } from "../common/logging/logger.js";
import { environment } from "../config/environment.js";
import { emailProvider } from "./email.provider.js";
import {
  invitationOtpTemplate,
  invitationTemplate,
  passwordChangedTemplate,
  passwordResetOtpTemplate,
  registrationOtpTemplate,
  welcomeTemplate
} from "./email.templates.js";
import type { EmailDeliveryProvider, EmailMessage } from "./email.types.js";

export class EmailService {
  constructor(
    private readonly provider: EmailDeliveryProvider,
    private readonly publicAppUrl: string
  ) {}

  private deliver(to: string, content: Omit<EmailMessage, "to">) {
    return this.provider.send({ to, ...content });
  }

  sendOtpEmail = async (toEmail: string, otp: string) => {
    try {
      const result = await this.deliver(toEmail, registrationOtpTemplate(otp));
      logger.info("email_sent", { kind: "registration_otp", to: toEmail, messageId: result.messageId });
    } catch (error) {
      logger.error("email_send_failed", { kind: "registration_otp", to: toEmail, error: error instanceof Error ? error.message : String(error) });
      throw new Error("Failed to send email");
    }
  };

  sendPasswordResetOtpEmail = async (toEmail: string, fullName: string, otp: string, expiresInMinutes = 10) => {
    try {
      const result = await this.deliver(toEmail, passwordResetOtpTemplate(fullName, otp, expiresInMinutes));
      logger.info("email_sent", { kind: "password_reset_otp", to: toEmail, messageId: result.messageId });
    } catch (error) {
      logger.error("email_send_failed", { kind: "password_reset_otp", to: toEmail, error: error instanceof Error ? error.message : String(error) });
      throw new Error("Failed to send email");
    }
  };

  sendPasswordChangedEmail = async (toEmail: string, fullName: string, details: { changedAt: Date; ip?: string; userAgent?: string }) => {
    try {
      const result = await this.deliver(toEmail, passwordChangedTemplate(fullName, details));
      logger.info("email_sent", { kind: "password_changed", to: toEmail, messageId: result.messageId });
    } catch (error) {
      logger.error("email_send_failed", { kind: "password_changed", to: toEmail, error: error instanceof Error ? error.message : String(error) });
    }
  };

  sendInvitationEmail = async (toEmail: string, token: string, role: string) => {
    try {
      const result = await this.deliver(toEmail, invitationTemplate(token, role, this.publicAppUrl));
      logger.info("email_sent", { kind: "invitation", to: toEmail, messageId: result.messageId });
    } catch (error) {
      logger.error("email_send_failed", { kind: "invitation", to: toEmail, error: error instanceof Error ? error.message : String(error) });
      throw new Error("Failed to send email");
    }
  };

  sendInvitationOtpEmail = (toEmail: string, fullName: string, otp: string) =>
    this.deliver(toEmail, invitationOtpTemplate(fullName, otp)).then(() => undefined);

  sendWelcomeEmail = (toEmail: string, fullName: string) =>
    this.deliver(toEmail, welcomeTemplate(fullName)).then(() => undefined);
}

export const emailService = new EmailService(emailProvider, environment.publicAppUrl);
export const sendOtpEmail = emailService.sendOtpEmail;
export const sendPasswordResetOtpEmail = emailService.sendPasswordResetOtpEmail;
export const sendPasswordChangedEmail = emailService.sendPasswordChangedEmail;
export const sendInvitationEmail = emailService.sendInvitationEmail;
export const sendInvitationOtpEmail = emailService.sendInvitationOtpEmail;
export const sendWelcomeEmail = emailService.sendWelcomeEmail;
