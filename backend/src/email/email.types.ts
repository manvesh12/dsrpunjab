export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailSendResult = {
  messageId?: string;
  [key: string]: unknown;
};

export interface EmailDeliveryProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
