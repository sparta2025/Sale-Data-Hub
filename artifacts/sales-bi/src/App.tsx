import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { AuthProvider, useAuth } from "./lib/auth";
import { I18nProvider } from "./lib/i18n";
import { useEffect, lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";

// Initialize API client
setAuthTokenGetter(() => localStorage.getItem("sbi_token"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});

// Lazy-loaded pages
const Login = lazy(() => import("@/pages/auth/login"));
const Dashboard = lazy(() => import("@/pages/dashboard/index"));
const KpiPage = lazy(() => import("@/pages/dashboard/kpi"));
const ForecastPage = lazy(() => import("@/pages/dashboard/forecast"));
const ScenarioPage = lazy(() => import("@/pages/dashboard/scenario"));
const DatasetsPage = lazy(() => import("@/pages/datasets/index"));
const AgentsPage = lazy(() => import("@/pages/agents/index"));
const AdminPage = lazy(() => import("@/pages/admin/index"));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isDemo, isLoading } = useAuth();
  
  if (isLoading) return <PageLoader />;
  
  if (!isAuthenticated && !isDemo) {
    return <Redirect to="/login" />;
  }
  
  return <Route {...rest} component={Component} />;
}

function Router() {
  const { isAuthenticated, isDemo } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">
          {isAuthenticated || isDemo ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
        </Route>
        <ProtectedRoute path="/dashboard/kpi" component={KpiPage} />
        <ProtectedRoute path="/dashboard/forecast" component={ForecastPage} />
        <ProtectedRoute path="/dashboard/scenario" component={ScenarioPage} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/datasets" component={DatasetsPage} />
        <ProtectedRoute path="/agents" component={AgentsPage} />
        <ProtectedRoute path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function ThemeLoader() {
  useEffect(() => {
    const theme = localStorage.getItem("sbi_theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark" || theme === "deep-ocean") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <ThemeLoader />
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
