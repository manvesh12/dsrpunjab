import { prisma } from "../database/prisma.client.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";

function notificationLink(type: string) {
  const [, projectId] = type.split(":");
  return projectId ? `/projects/${projectId}/reviewer` : "/notifications";
}

function notificationCategory(type: string) {
  if (type.startsWith("REVIEW_APPROVED")) return "success";
  if (type.startsWith("REVIEW_RETURNED")) return "warning";
  if (type.startsWith("REVIEW_NOTE")) return "info";
  return "info";
}

export class NotificationsService {
  async list(user: AuthUser) {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return notifications.map((notification) => ({
      id: Number(notification.id),
      message: notification.message,
      type: notificationCategory(notification.type),
      category: notification.type.split(":")[0],
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      link: notificationLink(notification.type),
    }));
  }

  async markRead(id: bigint, user: AuthUser) {
    const notification = await prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!notification) throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found.");
    await prisma.notification.update({ where: { id }, data: { read: true } });
    return { success: true };
  }

  async markAllRead(user: AuthUser) {
    const result = await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    return { success: true, updated: result.count };
  }

  async remove(id: bigint, user: AuthUser) {
    const notification = await prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!notification) throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found.");
    await prisma.notification.delete({ where: { id } });
    return { success: true };
  }
}

export const notificationsService = new NotificationsService();
