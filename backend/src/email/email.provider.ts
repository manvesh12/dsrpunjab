import nodemailer from "nodemailer";
import { logger } from "../common/logging/logger.js";
import { environment } from "../config/environment.js";
import type { EmailDeliveryProvider, EmailMessage, EmailSendResult } from "./email.types.js";

type EmailProviderConfig = Pick<typeof environment,
  "brevoApiKey" | "smtpHost" | "smtpPort" | "smtpSecure" | "smtpUser" | "smtpPass"
>;

export class SmtpBrevoEmailProvider implements EmailDeliveryProvider {
  constructor(private readonly config: EmailProviderConfig) {}

  private smtpTransporter() {
    if (!this.config.smtpUser || !this.config.smtpPass) return null;
    return nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpSecure,
      auth: { user: this.config.smtpUser, pass: this.config.smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      family: 4
    } as Parameters<typeof nodemailer.createTransport>[0]);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const transporter = this.smtpTransporter();
    if (transporter) {
      logger.info("email_delivery_started", { provider: "smtp", to: message.to, host: this.config.smtpHost });
      const info = await transporter.sendMail({
        from: `"Government of Punjab" <${this.config.smtpUser}>`,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html
      });
      return { messageId: info.messageId };
    }

    return this.sendWithBrevo(message);
  }

  private async sendWithBrevo(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.config.brevoApiKey) throw new Error("BREVO_API_KEY is not configured");
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": this.config.brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Government of Punjab", email: this.config.smtpUser || "no-reply@punjab-dsr.onrender.com" },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      logger.error("email_delivery_failed", { provider: "brevo", to: message.to, status: response.status });
      throw new Error(`Brevo API Error: ${response.status} ${detail}`);
    }
    return await response.json() as EmailSendResult;
  }
}

export const emailProvider = new SmtpBrevoEmailProvider(environment);
