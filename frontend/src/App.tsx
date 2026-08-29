import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Appointments from './pages/Appointments';
import Queue from './pages/Queue';
import QueueDisplay from './pages/QueueDisplay'; // 👈 THIS IMPORT WAS MISSING
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminResource from './pages/AdminResource';
import CheckIn from './pages/CheckIn';

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
          success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* 👇 THIS IS THE NEW DISPLAY ROUTE 👇 */}
          <Route path="/display" element={<QueueDisplay />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="services" element={<Services />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="queue" element={<Queue />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="schedules" element={<AdminResource title="Horaires" endpoint="/schedules" description="Plages d’ouverture et capacité." fields={['serviceId','dayOfWeek','startTime','endTime']} />} />
            <Route path="counters" element={<AdminResource title="Guichets" endpoint="/counters" description="Guichets affectés aux services." fields={['name','number','serviceId']} />} />
            <Route path="agents" element={<AdminResource title="Agents" endpoint="/users" description="Comptes agents et superviseurs." />} />
            <Route path="statistics" element={<AdminResource title="Statistiques" endpoint="/appointments/dashboard/stats" description="Indicateurs calculés à partir des rendez-vous." />} />
            <Route path="settings" element={<AdminResource title="Paramètres" endpoint="/settings" description="Nom, délais d’absence et rappels." />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
