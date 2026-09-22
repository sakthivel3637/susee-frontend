import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout';
import KioskLayout from '../layouts/KioskLayout/KioskLayout';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import { ROUTES } from '../config/routes';
import useAuthStore from '../store/useAuthStore';
import { getFirstReadablePath } from '../utils/authAccess';

import Login from '../pages/Auth/Login';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';
import AdminDashboardPage from '../pages/Dashboard/AdminDashboard';
import UserManagementPage from '../pages/Users/UserList';
import RoleManagementPage from '../pages/Roles/RoleList';
import RolePrivilegesForm from '../pages/Roles/RolePrivilegesForm';
import ServiceCategories from '../pages/Masters/ServiceCategories';
import ServiceCategoryForm from '../pages/Masters/ServiceCategoryForm';
import ServiceItems from '../pages/Masters/ServiceItems';
import ServiceItemForm from '../pages/Masters/ServiceItemForm';
import StateList from '../pages/Masters/StateList';
import StateForm from '../pages/Masters/StateForm';
import BrandList from '../pages/Masters/BrandList';
import BrandForm from '../pages/Masters/BrandForm';
import BayList from '../pages/Masters/BayList';
import BayForm from '../pages/Masters/BayForm';
import DistrictList from '../pages/Masters/DistrictList';
import DistrictForm from '../pages/Masters/DistrictForm';
import ServiceCenterList from '../pages/Masters/ServiceCenterList';
import ServiceCenterForm from '../pages/Masters/ServiceCenterForm';
import ServiceCenterView from '../pages/Masters/ServiceCenterView';
import ModuleList from '../pages/Masters/ModuleList';
import ModuleForm from '../pages/Masters/ModuleForm';
import StatusList from '../pages/Masters/StatusList';
import StatusForm from '../pages/Masters/StatusForm';
import LocationList from '../pages/Locations/LocationList';
import LocationForm from '../pages/Locations/LocationForm';
import AuditLogsPage from '../pages/Admin/AuditLogs';
import AuditLogDetailsPage from '../pages/Admin/AuditLogDetails';
import UserForm from '../pages/Users/UserForm';
import UserView from '../pages/Users/UserView';
import LocationView from '../pages/Locations/LocationView';
import GateEntryPage from '../pages/GateEntry/GateEntryPage';
import GateEntryDetails from '../pages/GateEntry/GateEntryDetails';
import CreateJobCardPage from '../pages/JobCards/JobCardCreate';
import PendingJobCardsPage from '../pages/JobCards/JobCardList';
import FloorDashboardPage from '../pages/WorkQueue/MechanicalQueue';
import MechanicalQueuePage from '../pages/WorkQueue/MechanicalQueue';
import AssignMechanicPage from '../pages/WorkQueue/AssignMechanicList';
import AdditionalWorkRequestPage from '../pages/AdditionalWork/AdditionalWorkList';
import CreateRequest from '../pages/AdditionalWork/CreateRequest';
import BodyShopDashboardPage from '../pages/WorkQueue/BodyShopQueue';
import BodyShopQueuePage from '../pages/WorkQueue/BodyShopQueue';
import BodyShopJobDetailPage from '../pages/WorkQueue/BodyShopQueue';
import BodyShopAssignMechanicPage from '../pages/WorkQueue/AssignMechanicList';
import BodyShopAdditionalWorkPage from '../pages/AdditionalWork/BodyShopAdditionalWorkList';
import BodyShopCreateRequestPage from '../pages/AdditionalWork/BodyShopCreateRequest';
import WaterWashDashboardPage from '../pages/WorkQueue/WaterWashQueue';
import WaterWashQueuePage from '../pages/WorkQueue/WaterWashQueue';
import WaterWashAssignMemberPage from '../pages/WorkQueue/AssignMechanicList';
import WashJobDetailPage from '../pages/WorkQueue/WaterWashQueue';
import ManagerDashboardPage from '../pages/Dashboard/ManagerDashboard';
import MdDashboardPage from '../pages/Dashboard/MDDashboard';
import MdStageSchedules from '../pages/Schedules/StageSchedules';
import MdStageScheduleForm from '../pages/Schedules/StageScheduleForm';
import TvKioskPage from '../pages/Kiosk/KioskDisplay';
import CustomerListPage from '../pages/Customers/CustomerListPage';
import CustomerDetailPage from '../pages/Customers/CustomerDetailPage';
import CustomerForm from '../pages/Customers/CustomerForm';
import VehicleListPage from '../pages/Vehicles/VehicleList';
import VehicleDetailPage from '../pages/Vehicles/VehicleDetailPage';
import VehicleEditPage from '../pages/Vehicles/VehicleEditPage';
import JobCardListPage from '../pages/JobCards/JobCardList';
import JobCardDetailPage from '../pages/JobCards/JobCardDetailPage';
import ServiceHistoryPage from '../pages/Vehicles/VehicleHistory';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import NotFound from '../pages/NotFound/NotFound';

function RootRedirect() {
  const { isAuthenticated, menus } = useAuthStore();
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Navigate to={getFirstReadablePath(menus, ROUTES.PROFILE)} replace />;
}

function LegacyMasterEditRedirect({ basePath }) {
  const { slug } = useParams();
  return <Navigate to={`/${basePath}/edit/${slug}`} replace />;
}

function LegacyRolePrivilegesEditRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/roles/privileges/edit/${slug}`} replace />;
}

function LegacyUserEditRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/users/edit/${slug}`} replace />;
}

function LegacyLocationEditRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/locations/edit/${slug}`} replace />;
}

function LegacyCustomerEditRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/customers/edit/${slug}`} replace />;
}

function LegacyJobCardEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`/job-cards/edit/${id}`} replace />;
}

function LegacyJobCardViewRedirect() {
  const { id } = useParams();
  return <Navigate to={`/job-cards/view/${id}`} replace />;
}


export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
    ],
  },
  {
    element: <KioskLayout />,
    children: [
      { path: 'kiosk/tv', element: <TvKioskPage /> },
      { path: 'display', element: <Navigate to={ROUTES.KIOSK_TV} replace /> },
      { path: 'kiosk', element: <Navigate to={ROUTES.KIOSK_TV} replace /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <RootRedirect /> },
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'admin-dashboard', element: <AdminDashboardPage /> },
              { path: 'roles', element: <RoleManagementPage /> },
              { path: 'roles/privileges', element: <RolePrivilegesForm /> },
              { path: 'roles/privileges/edit/:slug', element: <RolePrivilegesForm /> },
              { path: 'roles/privileges/:slug/edit', element: <LegacyRolePrivilegesEditRedirect /> },
              // { path: 'master-categories', element: <ServiceCategories /> },
              // { path: 'master-categories/new', element: <ServiceCategoryForm /> },
              // { path: 'master-categories/edit/:slug', element: <ServiceCategoryForm /> },
              // { path: 'master-categories/:slug/edit', element: <LegacyMasterEditRedirect basePath="master-categories" /> },
              { path: 'master-items', element: <ServiceItems /> },
              { path: 'master-items/new', element: <ServiceItemForm /> },
              { path: 'master-items/edit/:slug', element: <ServiceItemForm /> },
              { path: 'master-items/:slug/edit', element: <LegacyMasterEditRedirect basePath="master-items" /> },
              { path: 'master-states', element: <StateList /> },
              { path: 'master-states/new', element: <StateForm /> },
              { path: 'master-states/edit/:slug', element: <StateForm /> },
              { path: 'master-states/:slug/edit', element: <LegacyMasterEditRedirect basePath="master-states" /> },
              { path: 'master-brands', element: <BrandList /> },
              { path: 'master-brands/new', element: <BrandForm /> },
              { path: 'master-brands/edit/:slug', element: <BrandForm /> },
              { path: 'master-brands/:slug/edit', element: <LegacyMasterEditRedirect basePath="master-brands" /> },
              { path: 'master-districts', element: <DistrictList /> },
              { path: 'master-districts/new', element: <DistrictForm /> },
              { path: 'master-districts/edit/:slug', element: <DistrictForm /> },
              { path: 'master-districts/:slug/edit', element: <LegacyMasterEditRedirect basePath="master-districts" /> },
              { path: 'service-centers', element: <ServiceCenterList /> },
              { path: 'service-centers/new', element: <ServiceCenterForm /> },
              { path: 'service-centers/:id/edit', element: <ServiceCenterForm /> },
              { path: 'service-centers/:id', element: <ServiceCenterView /> },
              { path: 'modules', element: <ModuleList /> },
              { path: 'modules/new', element: <ModuleForm /> },
              { path: 'modules/edit/:slug', element: <ModuleForm /> },
              { path: 'modules/:slug/edit', element: <LegacyMasterEditRedirect basePath="modules" /> },
              { path: 'master-statuses', element: <StatusList /> },
              { path: 'master-statuses/new', element: <StatusForm /> },
              { path: 'master-statuses/edit/:slug', element: <StatusForm /> },
              { path: 'master-statuses/:slug/edit', element: <LegacyMasterEditRedirect basePath="master-statuses" /> },
              { path: 'locations', element: <LocationList /> },
              { path: 'locations/new', element: <LocationForm /> },
              { path: 'locations/edit/:slug', element: <LocationForm /> },
              { path: 'locations/view/:slug', element: <LocationView /> },
              { path: 'locations/:slug/edit', element: <LegacyLocationEditRedirect /> },
              { path: 'locations/:slug', element: <LocationView /> },
              { path: 'audit-logs', element: <AuditLogsPage /> },
              { path: 'audit-logs/:id', element: <AuditLogDetailsPage /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'gate-entry', element: <GateEntryPage /> },
              { path: 'gate-entry/view/:slug', element: <GateEntryDetails /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              // job-cards/create is mapped in the COMMON routes below, so we remove the CRM duplicate
              { path: 'job-cards/pending', element: <PendingJobCardsPage /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'floor-dashboard', element: <FloorDashboardPage /> },
              { path: 'mechanical-queue', element: <MechanicalQueuePage /> },
              { path: 'assign-mechanic', element: <AssignMechanicPage /> },
              { path: 'additional-work', element: <AdditionalWorkRequestPage /> },
              { path: 'additional-work/new', element: <CreateRequest /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'body-shop-dashboard', element: <BodyShopDashboardPage /> },
              { path: 'body-shop-queue', element: <BodyShopQueuePage /> },
              { path: 'body-shop-jobs/:id', element: <BodyShopJobDetailPage /> },
              { path: 'body-shop-assign-mechanic', element: <BodyShopAssignMechanicPage /> },
              { path: 'body-shop-additional-work', element: <BodyShopAdditionalWorkPage /> },
              { path: 'body-shop-additional-work/new', element: <BodyShopCreateRequestPage /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'water-wash-dashboard', element: <WaterWashDashboardPage /> },
              { path: 'water-wash-queue', element: <WaterWashQueuePage /> },
              { path: 'water-wash-assign-member', element: <WaterWashAssignMemberPage /> },
              { path: 'water-wash-jobs/:id', element: <WashJobDetailPage /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'manager-dashboard', element: <ManagerDashboardPage /> },
              { path: 'operations', element: <Navigate to={ROUTES.MANAGER_DASHBOARD} replace /> },
              { path: 'users', element: <UserManagementPage /> },
              { path: 'users/new', element: <UserForm /> },
              { path: 'users/edit/:slug', element: <UserForm /> },
              { path: 'users/view/:slug', element: <UserView /> },
              { path: 'users/:slug/edit', element: <LegacyUserEditRedirect /> },
              { path: 'users/:slug', element: <UserView /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'md-dashboard', element: <MdDashboardPage /> },
              { path: 'md-bays', element: <BayList /> },
              { path: 'md-bays/new', element: <BayForm /> },
              { path: 'md-bays/edit/:slug', element: <BayForm /> },
              { path: 'md-stage-schedules', element: <MdStageSchedules /> },
              { path: 'md-stage-schedules/new', element: <MdStageScheduleForm /> },
              { path: 'md-stage-schedules/:id/edit', element: <MdStageScheduleForm /> },
            ],
          },
          {
            element: <ProtectedRoute enforcePath />,
            children: [
              { path: 'customers', element: <CustomerListPage title="Customers" /> },
              { path: 'customers/new', element: <CustomerForm /> },
              { path: 'customers/edit/:slug', element: <CustomerForm /> },
              { path: 'customers/view/:slug', element: <CustomerDetailPage title="Customer Detail" /> },
              { path: 'customers/:slug/edit', element: <LegacyCustomerEditRedirect /> },
              { path: 'customers/:slug', element: <CustomerDetailPage title="Customer Detail" /> },
              { path: 'vehicles', element: <VehicleListPage /> },
              { path: 'vehicles/view/:slug', element: <VehicleDetailPage /> },
              { path: 'vehicles/edit/:slug', element: <VehicleEditPage /> },
              { path: 'vehicles/:slug/edit', element: <Navigate to="../edit/:slug" replace /> },
              { path: 'vehicles/:slug', element: <VehicleDetailPage /> },
              { path: 'vehicles/history/:slug', element: <ServiceHistoryPage /> },
              { path: 'vehicles/:slug/history', element: <Navigate to="../history/:slug" replace /> },
              { path: 'job-cards', element: <JobCardListPage /> },
              { path: 'job-cards/create', element: <CreateJobCardPage /> },
              { path: 'job-cards/edit/:slug', element: <CreateJobCardPage /> },
              { path: 'job-cards/view/:slug', element: <JobCardDetailPage title="Job Card Detail" /> },
              { path: 'job-cards/:id', element: <LegacyJobCardViewRedirect /> },
              { path: 'job-cards/:id/edit', element: <LegacyJobCardEditRedirect /> },
              { path: 'service-history', element: <ServiceHistoryPage /> },
              { path: 'notifications', element: <NotificationsPage title="Notifications" /> },
              { path: 'profile', element: <ProfilePage title="Profile" /> },
            ],
          },

          { path: 'dashboard', element: <Navigate to={ROUTES.MANAGER_DASHBOARD} replace /> },
          { path: 'work-queue/mechanical', element: <Navigate to={ROUTES.FLOOR_MECHANICAL_QUEUE} replace /> },
          { path: 'work-queue/body-shop', element: <Navigate to={ROUTES.BODY_SHOP_DASHBOARD} replace /> },
          { path: 'body-shop/dashboard', element: <Navigate to={ROUTES.BODY_SHOP_DASHBOARD} replace /> },
          { path: 'work-queue/water-wash', element: <Navigate to={ROUTES.WATER_WASH_QUEUE} replace /> },
          { path: 'water-wash/dashboard', element: <Navigate to={ROUTES.WATER_WASH_DASHBOARD} replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
