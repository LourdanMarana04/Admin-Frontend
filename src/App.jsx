import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DepartmentsProvider } from './utils/DepartmentsContext.jsx';
import { QueueProvider } from './utils/QueueContext.jsx';
import { UserProvider } from './utils/UserContext.jsx';

import LandingPage from './LandingPage';
import Login from './Login';
import Dashboard from './admin/DashboardAdmin';
import Reports from './admin/ReportsAdmin';
import Settings from './admin/SettingsAdmin';
import Departments from './admin/DepartmentsAdmin';
import TransactionPurposeAnalysis from './admin/TransactionPurposeAnalysisAdmin';
import Treasury from './components/Treasury';
import Assessor from './components/Assessor';
import Cio from './components/Cio';
import CityMayor from './components/CityMayor';
import CityPlanningDevelopmentCoordinator from './components/CityPlanningDevelopmentCoordinator';
import HumanResourcesManagement from './components/HumanResourcesManagement';
import SangguniangPanglungsod from './components/SangguniangPanglungsod';
import GeneralServicesOffice from './components/GeneralServicesOffice';
import BusinessPermitsLicensingOffice from './components/BusinessPermitsLicensingOffice';
import MainLayout from './layouts/MainLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperDashboard from './super-admin/SuperDashboard';
import SuperAnalytics from './super-admin/SuperAnalytics';
import SuperReports from './super-admin/SuperReports';
import SuperSettings from './super-admin/SuperSettings';
import SuperDepartments from './super-admin/SuperDepartments';
import SuperTransactionPurposeAnalysis from './super-admin/SuperTransactionPurposeAnalysis';
import ManageDepartments from './super-admin/ManageDepartments';
import TransactionHistory from './components/TransactionHistory';
import NowServing from './components/NowServing';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import AccessDenied from './components/AccessDenied';
import EditDepartments from './super-admin/EditDepartments';
import EditDepartmentInfo from './super-admin/EditDepartmentInfo';
import EditTransaction from './super-admin/EditTransaction';
import AnalyticsAdmin from './admin/AnalyticsAdmin.jsx';
import DepartmentDetails from './admin/DepartmentDetails';
import DepartmentGeneric from './admin/DepartmentGeneric';
import DepartmentDynamic from './admin/DepartmentDynamic';
import AdminRegistrationForm from './admin/AdminRegistrationForm';
import ManageAdmins from './super-admin/ManageAdmins';
import UserRegistrationForm from './UserRegistrationForm';
import NotificationsPage from './admin/NotificationsPage';
import ViewCreatedNotificationsPage from './super-admin/ViewCreatedNotificationsPage';

import EditRequirementForm from './super-admin/EditRequirementForm.jsx';
import SessionMonitor from './components/SessionMonitor';

function App() {
  return (
    <UserProvider>
    <DepartmentsProvider>
      <QueueProvider>
      <Router>
        <SessionMonitor>
        <Routes>
         
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-register" element={<AdminRegistrationForm />} />
          <Route path="/register" element={<UserRegistrationForm />} />

          {/* Admin Layout - Protected for Admin Users Only */}
          <Route element={
            <AdminRoute>
              <MainLayout />
            </AdminRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/:name" element={<DepartmentDynamic />} />
            <Route path="/treasury" element={<Treasury />} />
            <Route path="/assessor" element={<Assessor />} />
            <Route path="/cio" element={<Cio />} />
            <Route path="/Office-of-the-City-Mayor" element={<CityMayor />} />
            <Route path="/City-Planning-and-Development-Coordinator" element={<CityPlanningDevelopmentCoordinator />} />
            <Route path="/Human-Resources-Management-Office" element={<HumanResourcesManagement />} />
            <Route path="/Sangguniang-Panglungsod" element={<SangguniangPanglungsod />} />
            <Route path="/General-Services-Office" element={<GeneralServicesOffice />} />
            <Route path="/Business-Permits-and-Licensing-Office" element={<BusinessPermitsLicensingOffice />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<AnalyticsAdmin />} />
            <Route path="/transaction-purpose-analysis" element={<TransactionPurposeAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/transactionhistory" element={<TransactionHistory />} />
            <Route path="/nowserving" element={<NowServing />} />
            <Route path="/nowserving/treasury/:id" element={<NowServing />} />
            <Route path="/nowserving/:department/:queueId" element={<NowServing />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Super Admin Layout - Protected for Super Admin Users Only */}
          <Route element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }>
            <Route path="/superdashboard" element={<SuperDashboard />} />
            <Route path="/superdepartments" element={<SuperDepartments />} />
            <Route path="/superreports" element={<SuperReports />} />
            <Route path="/superanalytics" element={<SuperAnalytics />} /> 
            <Route path="/supertransaction-purpose-analysis" element={<SuperTransactionPurposeAnalysis />} />
            <Route path="/supersettings" element={<SuperSettings />} />
            <Route path="/manage-departments" element={<ManageDepartments />} />
            <Route path="/edit-departments" element={<EditDepartments />} />
            <Route path="/edit-department/:id" element={<EditDepartmentInfo />} />
            <Route path="/edit-transaction/:deptId/:transactionId" element={<EditTransaction />} />
            <Route path="/manage-admins" element={<ManageAdmins />} />
            <Route path="/superadmin/transactions/:deptId/:transactionId/requirement/:reqId/form-edit" element={<EditRequirementForm />} />
            <Route path="/view-created-notifications" element={<ViewCreatedNotificationsPage />} />
          </Route>

          {/* Catch-all route for unauthorized access */}
          <Route path="*" element={<AccessDenied />} />
        </Routes>
        </SessionMonitor>
      </Router>
      </QueueProvider>
    </DepartmentsProvider>
    </UserProvider>
  );
}

export default App;
