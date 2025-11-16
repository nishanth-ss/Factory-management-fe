import { queryClient } from "./lib/queryClient.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import LoginForm from "@/components/LoginForm";
import { Switch, Route, useLocation } from "wouter";
import RoleRoute from "@/roues-guard/RoleRoute";
import DashboardPage from "@/pages/DashboardPage";
import IndentsPage from "@/pages/IndentsPage";
import RawMaterialsPage from "@/pages/RawMaterialsPage";
import PurchaseOrdersPage from "@/pages/PurchaseOrdersPage";
import GRNPage from "@/pages/GRNPage";
import ProductionPage from "@/pages/ProductionPage";
import VendorsPage from "@/pages/VendorsPage";
import ExpenditurePage from "@/pages/ExpenditurePage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";
import UsersPage from "@/pages/UsersPage";
import NotAuthorized from "@/pages/NotAuthorized";
// import ProductPage from "./pages/ProductPage.tsx";
import BatchPage from "./pages/BatchPage";
import MaterialsHistory from "./components/MaterialsHistory.tsx";
import ManufacturingArticles from "./pages/ManufacturingArticles.tsx";
import TransistRegister from "./pages/TransistRegister.tsx";
import CustomerOrder from "./pages/CustomerOrder.tsx";

function Router() {
  return (
    <Switch>
      {/* Public / authenticated routes available to all logged-in roles */}
      <Route path="/" component={DashboardPage} />
      <Route path="/indents" component={IndentsPage} />
      <Route path="/materials" component={RawMaterialsPage} />
      <Route path="/materials/:id" component={MaterialsHistory} />
      {/* <Route path="/product" component={ProductPage} /> */}
      <Route path="/batches" component={BatchPage} />
      <Route path="/purchase-orders" component={PurchaseOrdersPage} />
      <Route path="/manufacturing-articles" component={ManufacturingArticles} />
      <Route path="/transist-register" component={TransistRegister} />
      <Route path="/customer-order" component={CustomerOrder} />
      <Route path="/grn" component={GRNPage} />
      <Route path="/production" component={ProductionPage} />
      <Route path="/expenditure" component={ExpenditurePage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/vendors" component={VendorsPage} />

      {/* Admin-only routes (roleId = 1) */}
      <Route path="/settings" component={SettingsPage} />
      <RoleRoute path="/users" component={UsersPage} allowedRoles={[1]} />
      <Route path="/users/:id" component={UsersPage} />

      {/* Not authorized & fallback */}
      <Route path="/not-authorized" component={NotAuthorized} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="text-sm text-muted-foreground">
              Manufacturing Management System
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // If authenticated and on /login, redirect to dashboard
  if (isAuthenticated && location === "/login") {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-muted-foreground">Checking authentication</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
