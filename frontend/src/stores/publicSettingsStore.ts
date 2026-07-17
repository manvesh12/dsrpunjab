import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Announcement {
  date: string;
  title: string;
  category: string;
  active: boolean;
}

export interface PublicSettingsState {
  noticeText: string;
  announcements: Announcement[];
  setNoticeText: (text: string) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
}

export const usePublicSettingsStore = create<PublicSettingsState>()(
  persist(
    (set) => ({
      noticeText:
        "⚡ District Survey Report preparation and review services are now available through the portal. • 📋 New guidelines for Sand Mining DSR have been published. • 🔒 Secure your portal login with new NIC ID credentials.",
      announcements: [
        {
          date: "15 JUL 2026",
          title: "Portal Maintenance Scheduled for Weekend",
          category: "Maintenance",
          active: true,
        },
        {
          date: "12 JUL 2026",
          title: "New DSR Guidelines Published by Ministry",
          category: "Information",
          active: true,
        },
        {
          date: "05 JUL 2026",
          title: "Training Session for District Officers",
          category: "Training",
          active: true,
        },
      ],
      setNoticeText: (noticeText) => set({ noticeText }),
      setAnnouncements: (announcements) => set({ announcements }),
    }),
    {
      name: "dsr-public-settings-storage",
    }
  )
);
