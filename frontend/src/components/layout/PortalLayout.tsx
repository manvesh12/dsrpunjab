import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ReviewerFloatingPanel from "../ui/ReviewerFloatingPanel";
import { useAuth } from "../../security/auth.context";

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Show floating panels only when inside a project
  const projectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const hasProject = Boolean(projectId);
  const canReview = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "REVIEWER"].includes(user?.role || "");

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <div className={collapsed ? "lg:pl-20" : "lg:pl-72"}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8 text-slate-900 dark:text-slate-100 transition-colors">
          <Outlet />
        </main>
      </div>

      {/* Bottom-right: Send review / notification panel (all project pages) */}
      {hasProject && canReview && projectId && <ReviewerFloatingPanel projectId={projectId} />}

    </div>
  );
}
