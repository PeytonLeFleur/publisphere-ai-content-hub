import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AgencySignup from "./pages/AgencySignup";
import ClientLogin from "./pages/ClientLogin";
import AgencyDashboard from "./pages/AgencyDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ApiKeysSettings from "./pages/ApiKeysSettings";
import WordPressSettings from "./pages/WordPressSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
