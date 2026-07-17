import dotenv from "dotenv";

dotenv.config();

function numberFromEnvironment(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const environment = Object.freeze({
  apiPort: numberFromEnvironment(process.env.API_PORT || process.env.PORT, 8080),
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "local-dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "local-dev-refresh-secret-change-me",
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "dsr_session",
  isProduction: process.env.NODE_ENV === "production",
  localFileStorage: process.env.LOCAL_FILE_STORAGE !== "false",
  awsRegion: process.env.AWS_REGION || process.env.S3_REGION || "ap-south-1",
  s3Bucket: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || "dsr-pdfs",
  s3Endpoint: process.env.AWS_S3_ENDPOINT || process.env.S3_ENDPOINT || "",
  s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === "true" || Boolean(process.env.S3_ENDPOINT),
  queueRedisUrl: process.env.QUEUE_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379",
  publicAppUrl: process.env.PUBLIC_APP_URL || "https://punjab-dsr.vercel.app/legacy",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: numberFromEnvironment(process.env.SMTP_PORT, 587),
  smtpSecure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || ""
});

export type Environment = typeof environment;
