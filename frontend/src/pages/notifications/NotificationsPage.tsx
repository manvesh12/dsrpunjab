import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Inbox, MessageSquareText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { notificationsApi, type Notification } from "../../api/notifications.api";
import PageHeader from "../../components/layout/PageHeader";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    notificationsApi.list()
      .then((items) => { if (active) setNotifications(items); })
      .catch(() => { if (active) toast.error("Notifications could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const unread = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markRead = async (notification: Notification) => {
    if (notification.read) return;
    await notificationsApi.markRead(notification.id);
    setNotifications((current) => current.map((entry) =>
      entry.id === notification.id ? { ...entry, read: true } : entry
    ));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((current) => current.map((entry) => ({ ...entry, read: true })));
    toast.success("All notifications marked as read.");
  };

  const remove = async (notification: Notification) => {
    await notificationsApi.remove(notification.id);
    setNotifications((current) => current.filter((entry) => entry.id !== notification.id));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Review observations, decisions and project workflow updates"
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Inbox size={19} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Workflow Inbox</h2>
            {unread > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                {unread} unread
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-52 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <Bell size={42} className="mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">No notifications yet</p>
            <p className="mt-1 text-sm text-slate-400">Project review updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 px-5 py-4 ${notification.read ? "bg-white" : "bg-blue-50/50"}`}
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.read ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"}`}>
                  <MessageSquareText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {(notification.category || "Workflow update").replaceAll("_", " ")}
                    </span>
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(notification.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    {notification.link && (
                      <Link
                        to={notification.link}
                        onClick={() => markRead(notification)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Open workflow
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markRead(notification)}
                      className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => remove(notification)}
                    aria-label="Delete notification"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
