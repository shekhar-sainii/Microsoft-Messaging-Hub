import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Config & Auth
import { useAuth } from "./auth/useAuth";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { NAVIGATION_TABS } from "./config/navigation";

// Layouts & Pages
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { WorkspacePage } from "./pages/WorkspacePage";

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />
        } />

        {/* Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Map NAVIGATION_TABS to Routes */}
            {NAVIGATION_TABS.map(tab => (
              <Route 
                key={tab.id} 
                path={tab.path} 
                element={<tab.component user={user} />} 
              />
            ))}
            
            {/* Dynamic Workspace Route */}
            <Route path="/workspace/:teamId/:channelId" element={<WorkspacePage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" reverseOrder={false} />
    </BrowserRouter>
  );
}

export default App;
