import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Components
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

// Public Pages
import Home from "@/pages/public/home";
import About from "@/pages/public/about";
import Intro from "@/pages/public/intro";
import ModuleIntro from "@/pages/public/module-intro";

// Auth Pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import ModulePage from "@/pages/student/module";
import Module1Page from "@/pages/student/module1";

// Instructor Pages
import Gradebook from "@/pages/instructor/gradebook";
import Settings from "@/pages/instructor/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/intro" component={Intro} />
        <Route path="/module-intro/:key" component={ModuleIntro} />
        
        {/* Auth Routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* Student Routes */}
        <Route path="/dashboard">
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/module/M1">
          <ProtectedRoute allowedRole="student">
            <Module1Page />
          </ProtectedRoute>
        </Route>
        <Route path="/module/:key">
          <ProtectedRoute allowedRole="student">
            <ModulePage />
          </ProtectedRoute>
        </Route>

        {/* Instructor Routes */}
        <Route path="/instructor/gradebook">
          <ProtectedRoute allowedRole="instructor">
            <Gradebook />
          </ProtectedRoute>
        </Route>
        <Route path="/instructor/settings">
          <ProtectedRoute allowedRole="instructor">
            <Settings />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
