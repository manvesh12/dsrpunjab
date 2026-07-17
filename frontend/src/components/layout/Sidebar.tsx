import { ChevronLeft, ChevronRight, LogOut, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  adminNavigationItems,
  appDetails,
  navigationItems,
} from "../../utils/constants";
import { useAuth } from "../../security/auth.context";
import { AccessControl } from "../auth/AccessControl";
import type { Permission } from "../../security/permissions";

const RoutePermissionMap: Record<string, Permission[]> = {
  "/dashboard": [],
  "/projects": [],
  "/workflow": ["approve_reports"],
  "/districts": ["view_all", "view_district"],
  "/reports": ["view_all", "view_district"],
  "/analytics": ["view_all", "view_district"],
  "/notifications": [],
  "/users": ["view_all"],
  "/audit": ["view_all"],
  "/settings": ["view_all"],
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export default function Sidebar({ open, onClose, collapsed, onCollapsedChange }: SidebarProps) {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white dark:bg-blue-500"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    }`;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden dark:bg-black/60"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:translate-x-0 dark:border-slate-800 dark:bg-slate-950 ${collapsed ? "w-20" : "w-72"} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex h-20 items-center border-b border-slate-200 px-4 dark:border-slate-800 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img 
            src="/assets/dsr-logo.png" 
            alt="Smart DSR Portal" 
            className={`shrink-0 object-contain transition-all ${collapsed ? "w-full h-8" : "w-10 h-10"} dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`} 
          />
          
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-black text-slate-900 dark:text-white leading-tight truncate">District Survey</span>
              <span className="text-[13px] font-black text-blue-600 dark:text-blue-400 leading-tight truncate">Report Portal</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
          <button type="button" onClick={() => onCollapsedChange(!collapsed)} className="absolute -right-3 top-24 hidden size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow lg:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:shadow-slate-900/50" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}</button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 hide-scrollbar">
          <p className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${collapsed ? "hidden" : ""}`}>
            Portal
          </p>

          {navigationItems.map((item) => (
            <AccessControl key={item.path} requiredPermissions={RoutePermissionMap[item.path] || []}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={linkClass}
              >
                <item.icon size={19} />
                {!collapsed && item.label}
              </NavLink>
            </AccessControl>
          ))}

          <p className={`mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${collapsed ? "hidden" : ""}`}>
            Administration
          </p>

          {adminNavigationItems.map((item) => (
            <AccessControl key={item.path} requiredPermissions={RoutePermissionMap[item.path] || []}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={linkClass}
              >
                <item.icon size={19} />
                {!collapsed && item.label}
              </NavLink>
            </AccessControl>
          ))}
        </nav>

        <div className={`border-t border-slate-200 ${collapsed ? "p-2" : "p-4"}`}>
          <div className={`mb-3 rounded-xl bg-slate-50 p-3 ${collapsed ? "hidden" : ""}`}>
            <p className="font-semibold text-slate-900">{user?.name || "System Admin"}</p>
            <p className="text-xs text-slate-500">{user?.role || "Administrator"}</p>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut size={19} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
