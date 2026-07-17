import assert from "node:assert/strict";
import test from "node:test";
import { EmailService } from "../../src/email/email.service.js";
import { invitationTemplate } from "../../src/email/email.templates.js";
import type { EmailDeliveryProvider, EmailMessage } from "../../src/email/email.types.js";

class CapturingProvider implements EmailDeliveryProvider {
  messages: EmailMessage[] = [];
  async send(message: EmailMessage) {
    this.messages.push(message);
    return { messageId: "test-message" };
  }
}

test("invitation template preserves the public registration URL and legacy role label", () => {
  const message = invitationTemplate("abc", "DISTRICT_OWNER", "https://portal.test/legacy");
  assert.match(message.text, /DISTRICT OWNER/);
  assert.match(message.html, /https:\/\/portal\.test\/legacy\/login\.html\?invite=abc/);
});

test("email service delegates OTP delivery without exposing provider details", async () => {
  const provider = new CapturingProvider();
  const service = new EmailService(provider, "https://portal.test/legacy");
  await service.sendInvitationOtpEmail("officer@example.test", "Officer", "123456");
  assert.equal(provider.messages.length, 1);
  assert.equal(provider.messages[0]?.to, "officer@example.test");
  assert.equal(provider.messages[0]?.subject, "Registration OTP - Punjab DSR Portal");
});

test("password changed notification remains best-effort", async () => {
  const provider: EmailDeliveryProvider = { send: async () => { throw new Error("offline"); } };
  const service = new EmailService(provider, "https://portal.test/legacy");
  await assert.doesNotReject(() => service.sendPasswordChangedEmail("officer@example.test", "Officer", { changedAt: new Date(0) }));
});
