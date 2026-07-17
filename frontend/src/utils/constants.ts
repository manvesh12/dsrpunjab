import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldCheck,
  Users,
  FileUp,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Workflow",
    path: "/workflow",
    icon: ClipboardList,
  },
  {
    label: "Districts",
    path: "/districts",
    icon: MapPin,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
];

export const adminNavigationItems = [
  {
    label: "Users",
    path: "/users",
    icon: Users,
  },
  {
    label: "Audit Logs",
    path: "/audit",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    label: "Import Previous DSR",
    path: "/import-previous-dsr",
    icon: FileUp,
  },
];

export const appDetails = {
  name: "Punjab DSR Portal",
  organization: "Department of Mines and Geology",
  state: "Government of Punjab",
  icon: Building2,
};
