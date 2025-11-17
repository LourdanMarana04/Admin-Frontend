import React, { useState, useEffect, useRef } from 'react';
import { FaUserPlus, FaEnvelope, FaLock, FaBuilding, FaEye, FaEyeSlash, FaEdit, FaTrash } from 'react-icons/fa';
import { useUser } from '../utils/UserContext';

const departments = [
  'Assessor',
  'Treasury',
  'Office of the City Mayor',
  'Office of the City Planning and Development Coordinator',
  'Human Resources Management Office',
  'Sangguniang Panglungsod',
  'City Information Office',
  'Office of the City Administrator',
  'General Services Office',
  'Business Permits and Licensing Office',
];

// Dummy data for admins (replace with API call in production)
const initialAdmins = [
  { id: 1, name: 'Admin One', email: 'admin1@cityhall.com', department: 'Treasury' },
  { id: 2, name: 'Admin Two', email: 'admin2@cityhall.com', department: 'Human Resources' },
];

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: '', password: '', retypePassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '', password: '', retypePassword: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditRetypePassword, setShowEditRetypePassword] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { user: currentUser, setUser } = useUser();
  const fetchAdminsRef = useRef();
  const isFetchingRef = useRef(false);

  // If not superadmin, show access denied
  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
          <p className="text-gray-700">You do not have permission to manage admin accounts. Only superadmins can access this page.</p>
        </div>
      </div>
    );
  }

  const fetchAdmins = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    console.log('Starting fetchAdmins...');
    isFetchingRef.current = true;
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Fetch response:', response.status, data);
      if (response.ok && data) {
        const adminUsers = Array.isArray(data) ? data.filter(u => u.role === 'admin' && u.email.endsWith('@cityhall.com')) : [];
        console.log('Filtered admin users:', adminUsers);
        setAdmins(adminUsers);
      } else {
        setError('Failed to fetch admins.');
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      console.log('Fetch completed');
    }
  };

  // Always keep the latest fetchAdmins in the ref
  fetchAdminsRef.current = fetchAdmins;

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Smart polling that adapts based on tab activity
  useEffect(() => {
    let interval = 30000; // 30 seconds default
    let timeoutId;

    const smartPoll = () => {
      // Faster polling when tab is active and visible
      if (document.hasFocus() && !document.hidden) {
        interval = 30000; // 30 seconds when active (reasonable)
      } else {
        interval = 60000; // 60 seconds when inactive
      }

      if (fetchAdminsRef.current) {
        fetchAdminsRef.current();
      }

      timeoutId = setTimeout(smartPoll, interval);
    };

    // Start smart polling
    smartPoll();

    // Listen for tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timeoutId);
        // Restart with slower interval when hidden
        timeoutId = setTimeout(smartPoll, 60000);
      } else {
        clearTimeout(timeoutId);
        // When tab becomes visible, fetch immediately
        if (fetchAdminsRef.current) {
          console.log('Tab became visible, fetching admins immediately...');
          fetchAdminsRef.current();
        }
        // Restart with normal interval when visible
        timeoutId = setTimeout(smartPoll, 30000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('admin-profile-updated event received in ManageAdmins', event.detail);
      if (fetchAdminsRef.current) {
        console.log('Calling fetchAdmins from event...');
        setTimeout(() => {
          fetchAdminsRef.current();
        }, 500);
      }
    };
    
    const handleStorage = (e) => {
      if (e.key === 'adminProfileUpdated' && fetchAdminsRef.current) {
        console.log('adminProfileUpdated localStorage event received', e.newValue);
        console.log('Calling fetchAdmins from storage event...');
        setTimeout(() => {
          fetchAdminsRef.current();
        }, 500);
      }
    };
    
    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorage);
    
    console.log('Event listeners added in ManageAdmins');
    
    return () => {
      window.removeEventListener('admin-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Enforce cityhall domain on frontend for better UX (backend also enforces)
    const cityhallEmail = /^[A-Za-z0-9._%+-]+@cityhall\.com$/i;
    if (!cityhallEmail.test(form.email)) {
      setError('Email must be a @cityhall.com address.');
      return;
    }
    if (form.password !== form.retypePassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.department) {
      setError('Please select a department.');
      return;
    }
    
    // Optimistic update - add admin to UI immediately
    const newAdmin = {
      id: Date.now(), // Temporary ID
      name: form.name,
      email: form.email,
      department: form.department,
    };
    setAdmins(prev => [...prev, newAdmin]);
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.retypePassword,
          role: 'admin',
          department: form.department,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status === false) {
        // Remove optimistic update on error
        setAdmins(prev => prev.filter(admin => admin.id !== newAdmin.id));
        // Prefer first validation error if present
        const firstError = data?.errors
          ? Object.values(data.errors).flat()[0]
          : null;
        setError(firstError || data.message || 'Failed to add admin.');
      } else {
        // Update with real data from server
        setAdmins(prev => prev.map(admin => 
          admin.id === newAdmin.id 
            ? { ...admin, id: data.data?.id || admin.id }
            : admin
        ));
        setForm({ name: '', email: '', department: '', password: '', retypePassword: '' });
        setShowForm(false);
        setSuccess('Admin added successfully!');
      }
    } catch (err) {
      // Remove optimistic update on error
      setAdmins(prev => prev.filter(admin => admin.id !== newAdmin.id));
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  // Edit handlers
  const openEditModal = (admin) => {
    setEditAdmin(admin);
    setEditForm({
      name: admin.name,
      email: admin.email,
      department: admin.department,
      password: '',
      retypePassword: '',
    });
    setShowEditPassword(false);
    setShowEditRetypePassword(false);
  };

  const handleEditInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (editForm.password && editForm.password !== editForm.retypePassword) {
      setError('Passwords do not match.');
      return;
    }
    
    // Optimistic update - update UI immediately
    const originalAdmins = [...admins];
    setAdmins(prev => prev.map(admin => 
      admin.id === editAdmin.id 
        ? { ...admin, name: editForm.name, email: editForm.email, department: editForm.department }
        : admin
    ));
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/users/${editAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          department: editForm.department,
          ...(editForm.password ? {
            password: editForm.password,
            password_confirmation: editForm.retypePassword,
          } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status === false) {
        // Revert optimistic update on error
        setAdmins(originalAdmins);
        setError(data.message || 'Failed to update admin.');
      } else {
        setEditAdmin(null);
        setSuccess('Admin updated successfully!');
        setTimeout(() => setSuccess(''), 5000);
        // Update localStorage if the edited admin is the current user
        if (currentUser && currentUser.id === editAdmin.id) {
          setUser({ ...currentUser, ...data.data });
        }
      }
    } catch (err) {
      // Revert optimistic update on error
      setAdmins(originalAdmins);
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  // Delete handlers
  const handleDeleteAdmin = async (id) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || data.status === false) {
        setError(data.message || 'Failed to delete admin.');
      } else {
        setAdmins(admins.filter(a => a.id !== id));
        setSuccess('Admin deleted successfully!');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
    setDeleteId(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-red-600 tracking-wide">Manage Admin Accounts</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow flex items-center"
          >
            <FaUserPlus className="mr-2" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-red-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-red-700 uppercase tracking-wider">Department</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-4 py-2 whitespace-nowrap font-semibold text-gray-800">{admin.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-700">{admin.email}</td>
                <td className="px-4 py-2 whitespace-nowrap text-blue-700 font-medium">{admin.department}</td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <button onClick={() => openEditModal(admin)} className="text-blue-600 hover:text-blue-800" title="Edit"><FaEdit /></button>
                  <button onClick={() => setDeleteId(admin.id)} className="text-red-600 hover:text-red-800" title="Delete"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal/Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-600">Add New Admin</h3>
              <button
                className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3">{error}</div>}
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaUserPlus className="mr-2 text-red-500" /> Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  placeholder="Full name"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaEnvelope className="mr-2 text-red-500" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  placeholder="Email address"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaBuilding className="mr-2 text-red-500" /> Department
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  required
                  disabled={loading}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaLock className="mr-2 text-red-500" /> Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  placeholder="Password"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaLock className="mr-2 text-red-500" /> Retype Password
                </label>
                <input
                  type="password"
                  name="retypePassword"
                  value={form.retypePassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  placeholder="Retype password"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 font-bold rounded-lg shadow-md transition duration-150 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {loading ? 'ADDING...' : 'ADD ADMIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-600">Edit Admin</h3>
              <button
                className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none"
                onClick={() => setEditAdmin(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3">{error}</div>}
            <form onSubmit={handleEditAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaUserPlus className="mr-2 text-red-500" /> Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  placeholder="Full name"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaEnvelope className="mr-2 text-red-500" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  placeholder="Email address"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                  <FaBuilding className="mr-2 text-red-500" /> Department
                </label>
                <select
                  name="department"
                  value={editForm.department}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  required
                  disabled={loading}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              {/* Only show password fields if currentUser is superadmin or editing own account */}
              {(currentUser && (currentUser.role === 'super_admin' || currentUser.id === editAdmin.id)) && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                      <FaLock className="mr-2 text-red-500" /> Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={editForm.password}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                      placeholder="New password (leave blank to keep current)"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                      <FaLock className="mr-2 text-red-500" /> Retype Password
                    </label>
                    <input
                      type="password"
                      name="retypePassword"
                      value={editForm.retypePassword}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                      placeholder="Retype new password"
                      disabled={loading}
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 font-bold rounded-lg shadow-md transition duration-150 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {loading ? 'UPDATING...' : 'UPDATE ADMIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600">Delete Admin</h3>
              <button
                className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none"
                onClick={() => setDeleteId(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <p className="mb-6">Are you sure you want to delete this admin?</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAdmin(deleteId)}
                className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600"
                disabled={loading}
              >
                {loading ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">{success}</div>}
    </div>
  );
};

export default ManageAdmins; 