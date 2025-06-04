
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CrmProvider } from "./contexts/CrmContext";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Pipeline from "./pages/Pipeline";
import Messages from "./pages/Messages";
import Calendar from "./pages/Calendar";
import Supervision from "./pages/Supervision";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CrmProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute>
                  <Layout>
                    <Leads />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/pipeline" element={
                <ProtectedRoute>
                  <Layout>
                    <Pipeline />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Layout>
                    <Messages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Layout>
                    <Calendar />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/supervision" element={
                <ProtectedRoute requiredRole={["admin", "supervisor"]}>
                  <Layout>
                    <Supervision />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute requiredRole={["admin"]}>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute requiredRole={["admin"]}>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </CrmProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
