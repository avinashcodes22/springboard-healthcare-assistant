import { Navigate, Route, Routes } from "react-router-dom";

import { AdminLayout } from "./components/layout/AdminLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { PublicLayout } from "./components/layout/PublicLayout";
import { RoleRoute } from "./components/layout/RoleRoute";
import { WorkerLayout } from "./components/layout/WorkerLayout";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminContentPage } from "./pages/admin/AdminContentPage";
import { AdminMonitoringPage } from "./pages/admin/AdminMonitoringPage";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminWorkersPage } from "./pages/admin/AdminWorkersPage";
import { DashboardPage } from "./pages/app/DashboardPage";
import { HistoryPage } from "./pages/app/HistoryPage";
import { LibraryDetailPage } from "./pages/app/LibraryDetailPage";
import { LibraryPage } from "./pages/app/LibraryPage";
import { ProfilePage } from "./pages/app/ProfilePage";
import { RecordsPage } from "./pages/app/RecordsPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { PatientRegisterPage } from "./pages/auth/PatientRegisterPage";
import { WorkerRegisterPage } from "./pages/auth/WorkerRegisterPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AboutPage } from "./pages/public/AboutPage";
import { HomePage } from "./pages/public/HomePage";
import { PendingApprovalPage } from "./pages/public/PendingApprovalPage";
import { PublicContentDetailPage } from "./pages/public/PublicContentDetailPage";
import { PublicLibraryPage } from "./pages/public/PublicLibraryPage";
import { WorkerDashboardPage } from "./pages/worker/WorkerDashboardPage";
import { WorkerFollowUpsPage } from "./pages/worker/WorkerFollowUpsPage";
import { WorkerPatientDetailPage } from "./pages/worker/WorkerPatientDetailPage";
import { WorkerPatientsPage } from "./pages/worker/WorkerPatientsPage";
import { WorkerTranslationPage } from "./pages/worker/WorkerTranslationPage";
import { WorkerPortalPage } from "./pages/app/WorkerPortalPage";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/health-resources" element={<PublicLibraryPage />} />
        <Route
          path="/health-resources/:contentId"
          element={<PublicContentDetailPage />}
        />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<PatientRegisterPage />} />
      <Route path="/register/worker" element={<WorkerRegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app/worker" element={<Navigate to="/worker" replace />} />

        <Route element={<RoleRoute allow={["patient"]} />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="library/:contentId" element={<LibraryDetailPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["healthcare_worker"]} />}>
          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<WorkerDashboardPage />} />
            <Route path="patients" element={<WorkerPatientsPage />} />
            <Route
              path="patients/:patientId"
              element={<WorkerPatientDetailPage />}
            />
            <Route
              path="translation"
              element={<WorkerTranslationPage />}
            />
            <Route path="content" element={<WorkerPortalPage />} />
            <Route path="follow-ups" element={<WorkerFollowUpsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={["administrator"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="workers" element={<AdminWorkersPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="monitoring" element={<AdminMonitoringPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
