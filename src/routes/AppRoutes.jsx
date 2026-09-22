import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';


import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout';
import KioskLayout from '../layouts/KioskLayout/KioskLayout';


import Login from '../pages/Auth/Login';
import ManagerDashboard from '../pages/Dashboard/ManagerDashboard';
import NotFound from '../pages/NotFound/NotFound';
import KioskDisplay from '../pages/Kiosk/KioskDisplay';
import TVKiosk from '../pages/TVKiosk/TVKiosk';
import GateEntryList from '../pages/GateEntry/GateEntryList';
import GateEntryDetails from '../pages/GateEntry/GateEntryDetails';
import JobCardCreate from '../pages/JobCards/JobCardCreate';
import JobCardList from '../pages/JobCards/JobCardList';
import MechanicalQueue from '../pages/WorkQueue/MechanicalQueue';
import BodyShopQueue from '../pages/WorkQueue/BodyShopQueue';
import WaterWashQueue from '../pages/WorkQueue/WaterWashQueue';
import UserList from '../pages/Users/UserList';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Public Kiosk Route */}
      <Route element={<KioskLayout />}>
        <Route path="/kiosk" element={<KioskDisplay />} />
        <Route path="/kiosk/tv" element={<TVKiosk />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<ManagerDashboard />} />
        <Route path="/gate-entry" element={<GateEntryList />} />
        <Route path="/gate-entry/view/:slug" element={<GateEntryDetails />} />

        {/* CRM Routes */}
        <Route path="/crm/dashboard" element={<Navigate to="/job-cards" replace />} />
        <Route path="/crm/job-cards/create" element={<JobCardCreate />} />

        {/* Floor Routes */}
        <Route path="/floor/dashboard" element={<Navigate to="/work-queue/mechanical" replace />} />

        <Route path="/job-cards" element={<JobCardList />} />
        <Route path="/job-cards/create" element={<JobCardCreate />} />
        <Route path="/work-queue/mechanical" element={<MechanicalQueue />} />

        {/* Body Shop & Water Wash Routes */}
        <Route path="/body-shop/dashboard" element={<Navigate to="/work-queue/body-shop" replace />} />
        <Route path="/work-queue/body-shop" element={<BodyShopQueue />} />

        <Route path="/water-wash/dashboard" element={<Navigate to="/work-queue/water-wash" replace />} />
        <Route path="/work-queue/water-wash" element={<WaterWashQueue />} />

        <Route path="/users" element={<UserList />} />

        {/* Super Admin Routes */}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
