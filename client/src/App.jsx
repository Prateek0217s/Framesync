import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AgencyDashboard from './pages/AgencyDashboard';
import ProjectDetail from './pages/ProjectDetail';
import ClientPortal from './pages/ClientPortal';
import NotFound from './pages/NotFound';

// Providers, router, and the toaster live in main.jsx; App is routes only.
export default function App() {
  return (
    <Routes>
      {/* Agency (admin) */}
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/"
        element={
          <ProtectedRoute role="admin">
            <AgencyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute role="admin">
            <ProjectDetail />
          </ProtectedRoute>
        }
      />

      {/* Client — public, gated only by the magic-link token */}
      <Route path="/portal/:token" element={<ClientPortal />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
