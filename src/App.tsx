import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CrmProvider } from "./contexts/CrmContext";
import { useFavicon } from "./hooks/useFavicon";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Pipeline from "./pages/Pipeline";
import Messages from "./pages/Messages";
import Calendar from "./pages/Calendar";
import Supervision from "./pages/Supervision";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerJourney from "./pages/CustomerJourney";
import { useDailyReportScheduler } from '@/hooks/useDailyReportScheduler';
import { useActivityTracker } from '@/hooks/useActivityTracker';

const queryClient = new QueryClient();

const FaviconManager = () => {
  useFavicon();
  return null;
};

const LayoutWrapper = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  useDailyReportScheduler();
  useActivityTracker();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CrmProvider>
              <FaviconManager />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <LayoutWrapper />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="profile" element={<Profile />} />
                  <Route 
                    path="supervision" 
                    element={
                      <ProtectedRoute requiredRole={["admin", "supervisor"]}>
                        <Supervision />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="users" 
                    element={
                      <ProtectedRoute requiredRole={["admin"]}>
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="customer-journey" 
                    element={
                      <ProtectedRoute requiredRole={["admin", "supervisor"]}>
                        <CustomerJourney />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="settings" 
                    element={
                      <ProtectedRoute requiredRole={["admin"]}>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                </Route>
              </Routes>
            </CrmProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
