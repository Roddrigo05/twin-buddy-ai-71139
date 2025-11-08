import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserSettingsProvider } from "@/contexts/UserSettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Notes from "./pages/Notes";
import Reminders from "./pages/Reminders";
import MoodJournal from "./pages/MoodJournal";
import WeeklyGoals from "./pages/WeeklyGoals";
import Routine from "./pages/Routine";
import Timeline from "./pages/Timeline";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ConfirmEmail from "./pages/ConfirmEmail";
import Welcome from "./pages/Welcome";
import ResetPassword from "./pages/ResetPassword";
import ReportBug from "./pages/ReportBug";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <UserSettingsProvider>
              <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <Welcome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <Notes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reminders"
                element={
                  <ProtectedRoute>
                    <Reminders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mood-journal"
                element={
                  <ProtectedRoute>
                    <MoodJournal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/weekly-goals"
                element={
                  <ProtectedRoute>
                    <WeeklyGoals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/routine"
                element={
                  <ProtectedRoute>
                    <Routine />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timeline"
                element={
                  <ProtectedRoute>
                    <Timeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-bug"
                element={
                  <ProtectedRoute>
                    <ReportBug />
                  </ProtectedRoute>
                }
              />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </UserSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
