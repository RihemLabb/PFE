import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Appointments from './pages/Appointments';
import Queue from './pages/Queue';
import QueueDisplay from './pages/QueueDisplay';
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

const STAFF_ROLES = ['ADMIN', 'SUPERVISOR', 'AGENT'];

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/display" element={<QueueDisplay />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={STAFF_ROLES}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN', 'SUPERVISOR']}
                  fallback="/dashboard/queue"
                >
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="services"
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN']}
                  fallback="/dashboard"
                >
                  <Services />
                </ProtectedRoute>
              }
            />
            <Route
              path="appointments"
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN', 'SUPERVISOR']}
                  fallback="/dashboard/queue"
                >
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="queue"
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN', 'AGENT']}
                  fallback="/dashboard"
                >
                  <Queue />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
