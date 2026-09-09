import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ShaderBackground, { SHADER_TINTS } from './components/ShaderBackground';
import AdminLogin from './pages/AdminLogin';
import AgencyDashboard from './pages/AgencyDashboard';
import ProjectDetail from './pages/ProjectDetail';
import ClientPortal from './pages/ClientPortal';
import NotFound from './pages/NotFound';

// Providers, router, and the toaster live in main.jsx; App is routes only.
export default function App() {
  return (
    <>
      {/* Light Ripple backdrop (skill: light-ripple) — Ice preset, calm drift.
          One persistent instance behind every route (the skill warns against
          multiple WebGL canvases per page), mounted outside <Routes> so it
          never re-initializes on navigation. Paints above html's fallback
          background but below all content — see index.css. In the cream
          theme the body paints over it (the canvas is near-black). */}
      <div className="fixed inset-0 -z-10 bg-black">
        <ShaderBackground
          tint={SHADER_TINTS.ice}
          brightness={1.1}
          speed={0.5}
          className="h-full w-full"
        />
      </div>
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
    </>
  );
}
