import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Surveyor = lazy(() => import("./pages/Surveyor"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const BranchManagement = lazy(() => import("./pages/BranchManagement"));
const SurveyConfig = lazy(() => import("./pages/SurveyConfig"));
const KpiManagement = lazy(() => import("./pages/KpiManagement"));
const Requests = lazy(() => import("./pages/Requests"));
const Tracking = lazy(() => import("./pages/Tracking"));
const SurveyorStats = lazy(() => import("./pages/SurveyorStats"));
const SurveyHistory = lazy(() => import("./pages/SurveyHistory"));
const GoalsManagement = lazy(() => import("./pages/GoalsManagement"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const MainLayout = lazy(() => import("./layouts/MainLayout"));

const PageLoader = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
    <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando Módulo Cineplanet...</p>
  </div>
);

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-mono animate-pulse">CARGANDO SISTEMA...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.some(r => r.toUpperCase() === (user?.role || '').toUpperCase())) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                {/* Default role-based redirect */}
                <Route index element={<RoleRedirect />} />
                
                {/* Common but role-restricted views */}
                <Route path="dashboard" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="survey" element={
                  <ProtectedRoute allowedRoles={['ENCUESTADOR', 'CREATOR', 'CREADOR', 'ADMINISTRADOR']}>
                    <Surveyor />
                  </ProtectedRoute>
                } />

                <Route path="surveyor-stats" element={
                  <ProtectedRoute allowedRoles={['ENCUESTADOR']}>
                    <SurveyorStats />
                  </ProtectedRoute>
                } />

                <Route path="users" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ANALISTA']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />

                <Route path="requests" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL']}>
                    <Requests />
                  </ProtectedRoute>
                } />

                <Route path="tracking" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL']}>
                    <Tracking />
                  </ProtectedRoute>
                } />

                <Route path="responses-history" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ADMINISTRADOR', 'ANALISTA', 'ZONAL']}>
                    <SurveyHistory />
                  </ProtectedRoute>
                } />

                <Route path="goals" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ANALISTA']}>
                    <GoalsManagement />
                  </ProtectedRoute>
                } />

                <Route path="branches" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ADMINISTRADOR']}>
                    <BranchManagement />
                  </ProtectedRoute>
                } />

                <Route path="surveys-config" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ADMINISTRADOR']}>
                    <SurveyConfig />
                  </ProtectedRoute>
                } />

                <Route path="kpis" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ADMINISTRADOR']}>
                    <KpiManagement />
                  </ProtectedRoute>
                } />

                <Route path="audit-logs" element={
                  <ProtectedRoute allowedRoles={['CREATOR', 'CREADOR', 'ANALISTA']}>
                    <AuditLogs />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" expand={true} richColors closeButton />
      </NotificationProvider>
    </AuthProvider>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'ENCUESTADOR') return <Navigate to="/survey" replace />;
  return <Navigate to="/dashboard" replace />;
}
