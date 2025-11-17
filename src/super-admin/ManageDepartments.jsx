import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Settings, 
  Activity, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { useUser } from '../utils/UserContext.jsx';
import EditTransaction from './EditTransaction.jsx';

const ManageDepartments = () => {
  try {
    const location = useLocation();
    const navigate = useNavigate();
    const { departments, loading } = useDepartments();
    const { user } = useUser();
    
    const { department: departmentName } = location.state || { department: 'Unknown Department' };
    const departmentObj = departments.find(d => d.name === departmentName);

    console.log('ManageDepartments rendered:', { 
      location, 
      departmentName, 
      departments, 
      departmentObj,
      user 
    });

    // If no department is selected, redirect back to departments
    if (!departmentName || departmentName === 'Unknown Department') {
      console.log('No department selected, redirecting to superdepartments');
      navigate('/superdepartments');
      return (
        <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
    }

    // If departments are still loading, show loading state
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading department data...</p>
          </div>
        </div>
      );
    }

    // If department not found, show error state
    if (!departmentObj) {
      return (
        <div className="min-h-screen bg-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/superdepartments')}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-3xl font-bold text-red-700">Department Not Found</h1>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">The department "{departmentName}" was not found.</p>
              <button
                onClick={() => navigate('/superdepartments')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
              >
                Return to Departments
              </button>
            </div>
          </div>
        </div>
      );
    }

    const [activeTab, setActiveTab] = useState('details');
    const [staffMembers, setStaffMembers] = useState([
      { id: 1, name: 'John Doe', position: 'Department Head', status: 'active', email: 'john.doe@cityhall.gov.ph' },
      { id: 2, name: 'Jane Smith', position: 'Staff Member', status: 'active', email: 'jane.smith@cityhall.gov.ph' },
      { id: 3, name: 'Mike Johnson', position: 'Staff Member', status: 'inactive', email: 'mike.johnson@cityhall.gov.ph' },
    ]);

    const [operatingHours, setOperatingHours] = useState({
      monday: { open: '08:00', close: '17:00', isOpen: true },
      tuesday: { open: '08:00', close: '17:00', isOpen: true },
      wednesday: { open: '08:00', close: '17:00', isOpen: true },
      thursday: { open: '08:00', close: '17:00', isOpen: true },
      friday: { open: '08:00', close: '17:00', isOpen: true },
      saturday: { open: '08:00', close: '12:00', isOpen: false },
      sunday: { open: '08:00', close: '17:00', isOpen: false },
    });

    const [queueSettings, setQueueSettings] = useState({
      maxQueueSize: 50,
      priorityQueueEnabled: true,
      estimatedWaitTime: 15,
      autoAssignEnabled: true,
    });

    const [departmentStatus, setDepartmentStatus] = useState({
      isActive: true,
      maintenanceMode: false,
      maxConcurrentUsers: 100,
    });

    const handleBack = () => {
      navigate('/superdepartments');
    };

    const addStaffMember = () => {
      const newStaff = {
        id: staffMembers.length + 1,
        name: 'New Staff Member',
        position: 'Staff Member',
        status: 'active',
        email: 'new.staff@cityhall.gov.ph'
      };
      setStaffMembers([...staffMembers, newStaff]);
    };

    const removeStaffMember = (id) => {
      setStaffMembers(staffMembers.filter(staff => staff.id !== id));
    };

    const toggleStaffStatus = (id) => {
      setStaffMembers(staffMembers.map(staff => 
        staff.id === id 
          ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
          : staff
      ));
    };

    const toggleDayStatus = (day) => {
      setOperatingHours({
        ...operatingHours,
        [day]: { ...operatingHours[day], isOpen: !operatingHours[day].isOpen }
      });
    };

    const tabs = [
      { id: 'details', label: 'Department Details', icon: <Info className="w-4 h-4" /> },
      { id: 'staff', label: 'Staff Management', icon: <Users className="w-4 h-4" /> },
      { id: 'queue', label: 'Transaction Settings', icon: <Settings className="w-4 h-4" /> },
      { id: 'status', label: 'Department Status', icon: <Activity className="w-4 h-4" /> },
    ];

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-red-700">{departmentName}</h1>
          </div>
          <div className="text-xl font-semibold text-gray-700">{departmentObj ? departmentObj.name : ''}</div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition duration-200 ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'details' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Department Details</h2>
              <div className="mb-4">
                <span className="font-semibold">Department Name:</span> {departmentObj ? departmentObj.name : departmentName}
              </div>
              <div>
                <span className="font-semibold">Transactions:</span>
                <ul className="list-disc ml-6 mt-2">
                  {departmentObj && departmentObj.transactions && departmentObj.transactions.length > 0 ? (
                    departmentObj.transactions.map(tx => (
                      <li key={tx.id}>{tx.name}</li>
                    ))
                  ) : (
                    <li className="text-gray-400">No transactions yet.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'staff' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
                <button
                  onClick={addStaffMember}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Staff
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Position</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffMembers.map((staff) => (
                      <tr key={staff.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{staff.name}</td>
                        <td className="py-3 px-4">{staff.position}</td>
                        <td className="py-3 px-4">{staff.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            staff.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {staff.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {staff.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleStaffStatus(staff.id)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                staff.status === 'active'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeStaffMember(staff.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Transactions</h2>
              <div className="bg-white rounded-lg shadow-md border">
                <ul className="divide-y divide-gray-200">
                  {departmentObj && departmentObj.transactions && departmentObj.transactions.length > 0 ? (
                    departmentObj.transactions.map(tx => (
                      <li key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <span className="font-medium text-gray-800">{tx.name}</span>
                        <button
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
                          onClick={() => navigate('/edittransaction', { state: { transactionId: tx.id, departmentName: departmentObj.name } })}
                        >
                          View Details
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-center text-gray-500">No transactions found for this department.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Department Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <span className="font-medium">Department Active</span>
                  <button
                    onClick={() => setDepartmentStatus({ ...departmentStatus, isActive: !departmentStatus.isActive })}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      departmentStatus.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {departmentStatus.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <span className="font-medium">Maintenance Mode</span>
                  <button
                    onClick={() => setDepartmentStatus({ ...departmentStatus, maintenanceMode: !departmentStatus.maintenanceMode })}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      departmentStatus.maintenanceMode 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {departmentStatus.maintenanceMode ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Concurrent Users
                  </label>
                  <input
                    type="number"
                    value={departmentStatus.maxConcurrentUsers}
                    onChange={(e) => setDepartmentStatus({
                      ...departmentStatus,
                      maxConcurrentUsers: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-200 font-semibold"
                >
                  Back to Departments
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ManageDepartments component:", error);
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-gray-600">An unexpected error occurred.</p>
        </div>
      </div>
    );
  }
};

export default ManageDepartments; 