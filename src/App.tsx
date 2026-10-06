import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { FloatingActions } from "@/components/FloatingActions";
import { AIChatBot } from "@/components/AIChatBot";
import Index from "./pages/public/Index";
import Services from "./pages/public/Services";
import BookService from "./pages/customer/BookService";
import Contact from "./pages/public/Contact";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProviderLogin from "./pages/provider/ProviderLogin";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import TrackBooking from "./pages/customer/TrackBooking";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerSignup from "./pages/customer/CustomerSignup";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import TermsOfService from "./pages/public/TermsOfService";
import NotFound from "./pages/public/NotFound";
import { QuickRoleSwitcher } from "@/components/QuickRoleSwitcher";

const queryClient = new QueryClient();

// Layout for customer-facing pages
const CustomerLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <StickyBottomBar />
    <FloatingActions />
    <AIChatBot />
  </div>
);

// Layout for provider pages (login & dashboard) with navbar
const ProviderLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Customer Pages */}
              <Route path="/" element={<CustomerLayout><Index /></CustomerLayout>} />
              <Route path="/services" element={<CustomerLayout><Services /></CustomerLayout>} />
              <Route path="/book" element={<CustomerLayout><BookService /></CustomerLayout>} />
              <Route path="/contact" element={<CustomerLayout><Contact /></CustomerLayout>} />
              <Route path="/track" element={<CustomerLayout><TrackBooking /></CustomerLayout>} />
              <Route path="/privacy" element={<CustomerLayout><PrivacyPolicy /></CustomerLayout>} />
              <Route path="/privacy-policy" element={<CustomerLayout><PrivacyPolicy /></CustomerLayout>} />
              <Route path="/terms" element={<CustomerLayout><TermsOfService /></CustomerLayout>} />
              <Route path="/terms-of-service" element={<CustomerLayout><TermsOfService /></CustomerLayout>} />

              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/signup" element={<CustomerSignup />} />

              {/* Admin Pages */}
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />

              {/* Provider Pages */}
              <Route path="/provider-login" element={<ProviderLayout><ProviderLogin /></ProviderLayout>} />
              <Route path="/provider" element={<ProviderLayout><ProviderDashboard /></ProviderLayout>} />
              <Route path="/provider-dashboard" element={<ProviderLayout><ProviderDashboard /></ProviderLayout>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <QuickRoleSwitcher />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
