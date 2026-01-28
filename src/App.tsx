import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import Loading from "@/components/common/Loading";

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('[Global Error]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
            <div className="bg-red-500 p-6 flex flex-col items-center text-white">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-xl font-black uppercase tracking-widest text-white/90">Application Crash</h1>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-slate-600 font-medium">An unexpected error has occurred that caused the application to stop.</p>
              <div className="bg-slate-900 text-red-400 p-4 rounded-xl font-mono text-[10px] overflow-auto max-h-[200px] border border-slate-800">
                {this.state.error?.toString()}
                <br />
                {this.state.error?.stack}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                RELOAD APPLICATION
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-2 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
              >
                GO TO HOME PAGE
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Index = lazy(() => import("./pages/Index"));
const Clubs = lazy(() => import("./pages/Clubs"));
import ClubDetail from "./pages/ClubDetail";
const Challenges = lazy(() => import("./pages/Challenges"));
const Projects = lazy(() => import("./pages/Projects"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CoAdminDashboard = lazy(() => import("./pages/CoAdminDashboard"));
const CoordinatorDashboard = lazy(() => import("./pages/CoordinatorDashboard"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const CampusMap = lazy(() => import("./pages/CampusMap"));
const Activity = lazy(() => import("./pages/Activity"));
const Badges = lazy(() => import("./pages/Badges"));
const ProjectChat = lazy(() => import("./pages/ProjectChat"));
const Events = lazy(() => import("./pages/Events"));
const Notes = lazy(() => import("./pages/Notes"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    {/* ... (all routes) */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/onboarding" element={
                      <ProtectedRoute>
                        <Onboarding />
                      </ProtectedRoute>
                    } />
                    <Route path="/clubs" element={
                      <ProtectedRoute>
                        <Clubs />
                      </ProtectedRoute>
                    } />
                    <Route path="/clubs/:id" element={
                      <ProtectedRoute>
                        <ClubDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/challenges" element={
                      <ProtectedRoute>
                        <Challenges />
                      </ProtectedRoute>
                    } />
                    <Route path="/projects" element={
                      <ProtectedRoute>
                        <Projects />
                      </ProtectedRoute>
                    } />
                    <Route path="/projects/:id/chat" element={
                      <ProtectedRoute>
                        <ProjectChat />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/leaderboard" element={
                      <ProtectedRoute>
                        <Leaderboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/co-admin" element={
                      <ProtectedRoute>
                        <CoAdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/club-coordinator" element={
                      <ProtectedRoute>
                        <CoordinatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/club-co-coordinator" element={
                      <ProtectedRoute>
                        <CoordinatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/club-head" element={
                      <ProtectedRoute>
                        <CoordinatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/core-team" element={
                      <ProtectedRoute>
                        <CoordinatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/owner" element={
                      <ProtectedRoute>
                        <OwnerDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/campus-map" element={
                      <ProtectedRoute>
                        <CampusMap />
                      </ProtectedRoute>
                    } />
                    <Route path="/activity" element={
                      <ProtectedRoute>
                        <Activity />
                      </ProtectedRoute>
                    } />
                    <Route path="/badges" element={
                      <ProtectedRoute>
                        <Badges />
                      </ProtectedRoute>
                    } />
                    <Route path="/events" element={
                      <ProtectedRoute>
                        <Events />
                      </ProtectedRoute>
                    } />
                    <Route path="/notes" element={
                      <ProtectedRoute>
                        <Notes />
                      </ProtectedRoute>
                    } />
                    <Route path="/help" element={
                      <ProtectedRoute>
                        <Help />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
