import { useState } from "react";
import { Outlet, useParams, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ReviewerFloatingPanel from "../ui/ReviewerFloatingPanel";
import SectionReviewWidget from "../ui/SectionReviewWidget";

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const params = useParams();
  const location = useLocation();

  // Show floating panels only when inside a project
  const hasProject = !!params.projectId;

  // Show the section review widget only on actual DSR section pages
  // (not on project overview, not on reviewer page)
  const sectionPaths = [
    "front-matter", "chapters", "plates", "cross-sections",
    "annexures", "replenishment", "model-dsr", "preview", "generate",
  ];
  const isOnSectionPage =
    hasProject &&
    sectionPaths.some((p) => location.pathname.includes(`/${p}`));

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
      {hasProject && <ReviewerFloatingPanel />}

      {/* Bottom-left: Context-aware section review widget (on DSR section pages only) */}
      {isOnSectionPage && <SectionReviewWidget />}
    </div>
  );
}
