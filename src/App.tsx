import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const Landing = lazy(() => import("./pages/Landing"));
const AgencySignup = lazy(() => import("./pages/AgencySignup"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const AgencyDashboard = lazy(() => import("./pages/AgencyDashboard"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ContentGeneration = lazy(() => import("./pages/ContentGeneration"));
const ContentLibrary = lazy(() => import("./pages/ContentLibrary"));
const ContentDetail = lazy(() => import("./pages/ContentDetail"));
const ContentCalendar = lazy(() => import("./pages/ContentCalendar"));
const Automation = lazy(() => import("./pages/Automation"));
const JobLogs = lazy(() => import("./pages/JobLogs"));
const GMBPosts = lazy(() => import("./pages/GMBPosts"));
const Settings = lazy(() => import("./pages/Settings"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const Help = lazy(() => import("./pages/Help"));
const ApiKeysSettings = lazy(() => import("./pages/ApiKeysSettings"));
const WordPressSettings = lazy(() => import("./pages/WordPressSettings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup/agency" element={<AgencySignup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<ClientLogin />} />
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/generate" element={<ContentGeneration />} />
            <Route path="/content" element={<ContentLibrary />} />
            <Route path="/content/:id" element={<ContentDetail />} />
            <Route path="/calendar" element={<ContentCalendar />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/jobs" element={<JobLogs />} />
            <Route path="/gmb-posts" element={<GMBPosts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/api-keys" element={<ApiKeysSettings />} />
            <Route path="/settings/wordpress" element={<WordPressSettings />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
