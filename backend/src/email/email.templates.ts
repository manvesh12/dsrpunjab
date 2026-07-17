import type { EmailMessage } from "./email.types.js";

type MessageContent = Omit<EmailMessage, "to">;

function shell(title: string, body: string, color = "#1e3a8a", shadow = true) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;${shadow ? " box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" : ""}">
      <div style="background-color: ${color}; padding: 24px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Punjab DSR Portal</h2>
      </div>
      <div style="padding: 32px 24px; background-color: #ffffff;">
        <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">${title}</h3>
        ${body}
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Government of Punjab. All rights reserved.</p>
      </div>
    </div>
  `;
}

function otpBlock(otp: string) {
  return `<div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 36px; letter-spacing: 4px; font-weight: 700;">${otp}</h1>
        </div>`;
}

export function registrationOtpTemplate(otp: string): MessageContent {
  return {
    subject: "Verify your Registration - Punjab DSR",
    text: `Your OTP for registration on the Punjab DSR Portal is: ${otp}\n\nThis OTP is valid for 10 minutes. Please do not share it with anyone.`,
    html: shell("Registration Verification", `
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Thank you for registering on the Punjab DSR Portal. Please use the following One-Time Password (OTP) to verify your account:</p>
        ${otpBlock(otp)}
        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>`)
  };
}

export function passwordResetOtpTemplate(fullName: string, otp: string, expiresInMinutes: number): MessageContent {
  return {
    subject: "Password Reset OTP - Punjab DSR",
    text: `Dear ${fullName},\n\nYour OTP for password reset is: ${otp}\n\nThis OTP is valid for ${expiresInMinutes} minutes. If you did not request this, please ignore this email and contact your portal administrator.\n\nGovernment of Punjab`,
    html: shell("Password Reset Verification", `
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Dear ${fullName}, please use the following One-Time Password (OTP) to reset your Smart DSR Portal password:</p>
        ${otpBlock(otp)}
        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">This OTP is valid for ${expiresInMinutes} minutes. Please do not share it with anyone.</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">If you did not request this password reset, please ignore this email and notify your portal administrator.</p>`)
  };
}

export function passwordChangedTemplate(fullName: string, details: { changedAt: Date; ip?: string; userAgent?: string }): MessageContent {
  const changedAt = details.changedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const ip = details.ip || "Not available";
  const userAgent = details.userAgent || "Not available";
  return {
    subject: "Password Changed Successfully - Punjab DSR",
    text: `Dear ${fullName},\n\nYour Punjab DSR Portal password was changed successfully on ${changedAt}.\n\nIP: ${ip}\nBrowser: ${userAgent}\n\nIf you did not make this change, contact your portal administrator immediately.\n\nGovernment of Punjab`,
    html: shell("Password Changed Successfully", `
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Dear ${fullName}, your Smart DSR Portal password was changed successfully.</p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; color: #374151; font-size: 14px;">
          <p style="margin: 0 0 8px;"><strong>Change time:</strong> ${changedAt}</p>
          <p style="margin: 0 0 8px;"><strong>IP:</strong> ${ip}</p>
          <p style="margin: 0;"><strong>Browser:</strong> ${userAgent}</p>
        </div>
        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">If you did not make this change, contact your portal administrator immediately.</p>`, "#166534", false)
  };
}

export function invitationTemplate(token: string, role: string, publicAppUrl: string): MessageContent {
  const inviteLink = `${publicAppUrl}/login.html?invite=${token}`;
  const roleDisplay = role.replace(/_/g, " ").replace(/\w\S*/g, word => word.replace(/^\w/, character => character.toUpperCase()));
  return {
    subject: "Registration Link - Punjab DSR Portal",
    text: `Your registration on the Punjab DSR Portal has been initiated as a ${roleDisplay}.\n\nPlease click the link below to complete your registration:\n${inviteLink}\n\nThis link is valid for 7 days.`,
    html: shell("Complete Your Registration", `
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Your registration on the Punjab DSR Portal has been initiated. Your designated role is <strong style="color: #1e3a8a;">${roleDisplay}</strong>.</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Please click the button below to complete your registration and set up your account password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Complete Registration</a>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb; font-size: 14px; margin-top: 0; background-color: #eff6ff; padding: 12px; border-radius: 6px;">${inviteLink}</p>
        <p style="color: #ef4444; font-size: 14px; font-weight: 500; margin-top: 24px;">Note: This registration link is valid for 7 days and can only be used by this invited email address.</p>`)
  };
}

export function invitationOtpTemplate(fullName: string, otp: string): MessageContent {
  return {
    subject: "Registration OTP - Punjab DSR Portal",
    text: `Dear ${fullName},\n\nYour OTP for completing invite-only registration is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
    html: shell("Registration OTP Verification", `
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Dear ${fullName}, use this OTP to complete your invite-only Smart DSR Portal registration:</p>
        ${otpBlock(otp)}
        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>`, "#1e3a8a", false)
  };
}

export function welcomeTemplate(fullName: string): MessageContent {
  return {
    subject: "Welcome to Punjab DSR Portal",
    text: `Dear ${fullName},\n\nYour Smart DSR Portal account has been created successfully. You can now log in using your registered email address.`,
    html: shell("Registration Successful", `
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Dear ${fullName}, your Smart DSR Portal account has been created successfully.</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You may now sign in with your registered email address.</p>`, "#166534", false)
  };
}
