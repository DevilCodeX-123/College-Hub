import { Suspense, lazy } from "react";
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

// Lazy load pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Index = lazy(() => import("./pages/Index"));
const Clubs = lazy(() => import("./pages/Clubs"));
const ClubDetail = lazy(() => import("./pages/ClubDetail"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
