import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import { ProtectedRoute, RoleGuard } from "../security/Guards";
import NotAccessible from "../components/layout/NotAccessible";

import PortalLayout from "../components/layout/PortalLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import CreateProjectPage from "../pages/projects/CreateProjectPage";
import ProjectsPage from "../pages/projects/ProjectsPage";
import ModuleEditor from "../components/ui/ModuleEditor";
import AnnexureEditorPage from "../pages/annexures/AnnexureEditorPage";
import AdditionalAnnexureEditorPage from "../pages/annexures/AdditionalAnnexureEditorPage";
import ProjectDetailsPage from "../pages/projects/ProjectDetailsPage";
import ReplenishmentBuilderPage from "../pages/replenishment/ReplenishmentBuilderPage";
import ModelDsrPage from "../pages/replenishment/ModelDsrPage";
import ReviewerPage from "../pages/workflow/ReviewerPage";
import AnnexuresPage from "../pages/annexures/AnnexuresPage";
import ReportPreviewPage from "../pages/reports/ReportPreviewPage";
import FrontMatterPage from "../pages/dsr-builder/FrontMatterPage";
import ChaptersPage from "../pages/dsr-builder/ChaptersPage";
import PlatesPage from "../pages/dsr-builder/PlatesPage";
import CrossSectionGraphsPage from "../pages/dsr-builder/CrossSectionGraphsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import HomePage from "../pages/public/HomePage";
import SettingsPage from "../pages/settings/SettingsPage";
import AuditPage from "../pages/audit/AuditPage";
import UsersPage from "../pages/users/UsersPage";
import ReportsPage from "../pages/reports/ReportsPage";
import AnalyticsPage from "../pages/analytics/AnalyticsPage";
import ImportDsrPage from "../pages/import-dsr/ImportDsrPage";
const portalModules = {
  workflow: { title:"Workflow", description:"Track review, observations and approval stages", columns:[{key:"report",label:"Report"},{key:"stage",label:"Current Stage"},{key:"assignee",label:"Assigned To"},{key:"due",label:"Due Date",type:"date" as const},{key:"status",label:"Status"}] },
  districts: { title:"Districts", description:"Punjab district information and DSR coverage", columns:[{key:"district",label:"District"},{key:"rivers",label:"Rivers"},{key:"projects",label:"DSR Projects",type:"number" as const},{key:"officer",label:"District Officer"},{key:"status",label:"Status"}] },
  reports: { title:"Reports", description:"Generated drafts, review copies and final reports", columns:[{key:"title",label:"Report Title"},{key:"district",label:"District"},{key:"version",label:"Version"},{key:"generated",label:"Generated On",type:"date" as const},{key:"status",label:"Status"}] },
  analytics: { title:"Analytics Data", description:"Project, mineral and district performance indicators", columns:[{key:"metric",label:"Metric"},{key:"district",label:"District"},{key:"period",label:"Period"},{key:"value",label:"Value",type:"number" as const},{key:"trend",label:"Trend"}] },
  notifications: { title:"Notifications", description:"Portal alerts and review updates", columns:[{key:"subject",label:"Subject"},{key:"message",label:"Message"},{key:"date",label:"Date",type:"date" as const},{key:"priority",label:"Priority"},{key:"status",label:"Status"}] },
  users: { title:"Users & Roles", description:"Manage portal users, districts and permissions", columns:[{key:"name",label:"Name"},{key:"email",label:"Email"},{key:"role",label:"Role"},{key:"district",label:"District"},{key:"status",label:"Status"}] },
  audit: { title:"Audit Logs", description:"Review all important portal activity", columns:[{key:"user",label:"User"},{key:"action",label:"Action"},{key:"module",label:"Module"},{key:"time",label:"Date & Time"},{key:"ip",label:"IP Address"}] },
  settings: { title:"Portal Settings", description:"Configure organization and report defaults", columns:[{key:"setting",label:"Setting"},{key:"value",label:"Value"},{key:"group",label:"Group"},{key:"updatedBy",label:"Updated By"}] },
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default route */}
      <Route
        path="/"
        element={<HomePage />}
      />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/complete" element={<RegisterPage />} />

      {/* Portal routes */}
      <Route element={
        <ProtectedRoute>
          <PortalLayout />
        </ProtectedRoute>
      }>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/projects"
          element={<ProjectsPage />}
        />

        <Route
          path="/projects/create"
          element={
            <RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN"]} fallback={<NotAccessible />}>
              <CreateProjectPage />
            </RoleGuard>
          }
        />

        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        
        {/* Data Entry & Project Editing Routes */}
        <Route element={<RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "DATA_ENTRY_OPERATOR", "DISTRICT_OFFICER"]} fallback={<NotAccessible />}><Outlet /></RoleGuard>}>
          <Route path="/projects/:projectId/front-matter" element={<FrontMatterPage />} />
          <Route path="/projects/:projectId/chapters" element={<ChaptersPage />} />
          <Route path="/projects/:projectId/plates" element={<PlatesPage />} />
          <Route path="/projects/:projectId/cross-sections" element={<CrossSectionGraphsPage />} />
          <Route path="/projects/:projectId/annexures" element={<AnnexuresPage />} />
          {["1","2","3","4","5","6","7"].map((annexure) => <Route key={annexure} path={`/projects/:projectId/annexures/${annexure}`} element={<AnnexureEditorPage annexure={annexure} />} />)}
          {["B","C","D","E","F","G","H","I","J","K"].map((letter) => <Route key={letter} path={`/projects/:projectId/annexures/additional/${letter.toLowerCase()}`} element={<AdditionalAnnexureEditorPage letter={letter} />} />)}
          <Route path="/projects/:projectId/replenishment" element={<ReplenishmentBuilderPage />} />
          <Route path="/projects/:projectId/model-dsr" element={<ModelDsrPage />} />
        </Route>

        <Route path="/projects/:projectId/preview" element={<ReportPreviewPage />} />
        <Route path="/projects/:projectId/generate" element={<RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "REPORT_GENERATOR"]} fallback={<NotAccessible />}><ReportPreviewPage /></RoleGuard>} />
        
        <Route path="/projects/:projectId/reviewer" element={<RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN", "REVIEWER"]} fallback={<NotAccessible />}><ReviewerPage /></RoleGuard>} />
        <Route path="/reviewer" element={<RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN", "REVIEWER"]} fallback={<NotAccessible />}><ReviewerPage /></RoleGuard>} />

        <Route
          path="/workflow"
          element={<RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN", "REVIEWER"]} fallback={<NotAccessible />}><ReviewerPage /></RoleGuard>}
        />

        <Route
          path="/districts"
          element={<ModuleEditor storageKey="districts" {...portalModules.districts} />}
        />

        <Route
          path="/reports"
          element={<ReportsPage />}
        />

        <Route
          path="/analytics"
          element={<AnalyticsPage />}
        />

        <Route
          path="/notifications"
          element={<ModuleEditor storageKey="notifications" {...portalModules.notifications} />}
        />

        <Route
          path="/users"
          element={<UsersPage />}
        />
        <Route
          path="/audit"
          element={<AuditPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

        <Route
          path="/import-previous-dsr"
          element={
            <RoleGuard roles={["SUPER_ADMIN", "STATE_ADMIN"]} fallback={<NotAccessible />}>
              <ImportDsrPage />
            </RoleGuard>
          }
        />
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}
