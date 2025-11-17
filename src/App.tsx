import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy load all page components to prevent import errors from breaking the app
const Landing = lazy(() => import("./pages/Landing"));
const AgencySignup = lazy(() => import("./pages/AgencySignup"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const AgencyDashboard = lazy(() => import("./pages/AgencyDashboard"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ApiKeysSettings = lazy(() => import("./pages/ApiKeysSettings"));
const WordPressSettings = lazy(() => import("./pages/WordPressSettings"));
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
            <Route path="/login" element={<ClientLogin />} />
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/settings/api-keys" element={<ApiKeysSettings />} />
            <Route path="/settings/wordpress" element={<WordPressSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
