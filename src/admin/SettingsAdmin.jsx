import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDatabase, FaFileDownload, FaRedo, FaTrashAlt } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const isSuperAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'super_admin';
};

const Settings = () => {
  const navigate = useNavigate();
  const defaultTab = isSuperAdmin() ? 'profile' : 'profile';
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Tab navigation for department admin
  const tabs = [
    { key: 'profile', label: 'Profile Settings' },
    { key: 'backup', label: 'Backup & Restore' },
  ];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Backup & Restore state
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [backupSuccess, setBackupSuccess] = useState('');
  const [restoringBackupId, setRestoringBackupId] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setUser(currentUser);
    }
    if (activeTab === 'backup') {
      fetchBackups();
    }
  }, [activeTab]);


  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setError('User not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        console.log('Profile update successful:', updatedUser);
        
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(updatedUser.user));
        
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Update localStorage for cross-tab communication - this will trigger storage event in other tabs
        const updateData = {
          userId: updatedUser.user.id,
          timestamp: Date.now(),
          action: 'profile_updated'
        };
        
        localStorage.setItem('adminProfileUpdated', JSON.stringify(updateData));
        console.log('localStorage updated for cross-tab communication');
        
        // Also dispatch event for same-tab communication
        const customEvent = new CustomEvent('admin-profile-updated', {
          detail: updateData
        });
        window.dispatchEvent(customEvent);
        console.log('Event dispatched for same-tab communication');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Backup & Restore functions
  const fetchBackups = async () => {
    setLoadingBackups(true);
    setBackupError('');
    try {
      const response = await fetch(`${API_BASE_URL}/backup/list`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        // Filter backups by department if user is department admin
        const user = getCurrentUser();
        if (user && user.role === 'admin' && user.department_id) {
          const filteredBackups = (data.data || []).filter(backup => 
            backup.department_id === user.department_id || !backup.department_id
          );
          setBackups(filteredBackups);
        } else {
          setBackups(data.data || []);
        }
      } else {
        setBackupError(data.message || 'Failed to fetch backups');
      }
    } catch (error) {
      setBackupError('Network error. Please try again.');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setBackupError('');
    setBackupSuccess('');
    try {
      const user = getCurrentUser();
      const requestBody = {};
      if (user && user.role === 'admin' && user.department_id) {
        requestBody.department_id = user.department_id;
      }
      
      const response = await fetch(`${API_BASE_URL}/backup/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (response.ok) {
        setBackupSuccess('Backup created successfully!');
        setTimeout(() => setBackupSuccess(''), 3000);
        fetchBackups();
      } else {
        setBackupError(data.message || 'Failed to create backup');
      }
    } catch (error) {
      setBackupError('Network error. Please try again.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/backup/download/${backupId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `backup_${backupId}.sql`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setBackupError(data.message || 'Failed to download backup');
      }
    } catch (error) {
      setBackupError('Network error. Please try again.');
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (!restoreConfirm) {
      setRestoreConfirm(true);
      setRestoringBackupId(backupId);
      return;
    }

    if (!window.confirm('WARNING: This will replace your department data with the backup data. This action cannot be undone. Are you absolutely sure?')) {
      setRestoreConfirm(false);
      setRestoringBackupId(null);
      return;
    }

    setBackupError('');
    setBackupSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/backup/restore/${backupId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await response.json();
      if (response.ok) {
        setBackupSuccess('Department data restored successfully!');
        setTimeout(() => {
          setBackupSuccess('');
          window.location.reload();
        }, 2000);
      } else {
        setBackupError(data.message || 'Failed to restore backup');
      }
    } catch (error) {
      setBackupError('Network error. Please try again.');
    } finally {
      setRestoreConfirm(false);
      setRestoringBackupId(null);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    setBackupError('');
    try {
      const response = await fetch(`${API_BASE_URL}/backup/delete/${backupId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setBackupSuccess('Backup deleted successfully!');
        setTimeout(() => setBackupSuccess(''), 3000);
        fetchBackups();
      } else {
        setBackupError(data.message || 'Failed to delete backup');
      }
    } catch (error) {
      setBackupError('Network error. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {user && user.role === 'admin' && user.department 
                  ? `${user.department} Profile Settings`
                  : 'Profile Settings'
                }
              </h3>
              
              {/* Department-specific welcome message for admin users */}
              {user && user.role === 'admin' && user.department && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-md font-semibold mb-2 text-blue-800">
                    Settings for {user.department}
                  </h4>
                  <p className="text-sm text-blue-700">
                    Manage your profile and department-specific settings.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {user && user.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={user.department}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Department assignment can only be changed by a super admin.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        );
      case 'backup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Restore</h3>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-md font-semibold mb-2 text-blue-800">
                  <FaDatabase className="inline mr-2" />
                  Department Backup
                </h4>
                <p className="text-sm text-blue-700">
                  {user && user.department 
                    ? `Create, download, and restore backups for ${user.department}. This includes your department's transactions, queue numbers, and related data.`
                    : 'Create, download, and restore department-specific backups.'
                  }
                </p>
              </div>

              {/* Success/Error Messages */}
              {backupSuccess && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {backupSuccess}
                </div>
              )}
              {backupError && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {backupError}
                </div>
              )}

              {/* Create Backup Button */}
              <div className="mb-6">
                <button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  <FaDatabase className="w-4 h-4" />
                  {creatingBackup ? 'Creating Backup...' : `Create ${user?.department || 'Department'} Backup`}
                </button>
              </div>

              {/* Backup List */}
              <div>
                <h4 className="text-md font-semibold mb-3 text-gray-800">Backup History</h4>
                {loadingBackups ? (
                  <div className="text-center py-8 text-gray-500">Loading backups...</div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No backups found. Create your first backup above.</div>
                ) : (
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div
                        key={backup.id}
                        className="border border-gray-300 rounded-md p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FaDatabase className="text-blue-600" />
                              <span className="font-medium text-gray-800">
                                {backup.filename}
                              </span>
                              {!backup.exists && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  File Missing
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Size: {backup.file_size}</p>
                              <p>Created: {new Date(backup.created_at).toLocaleString()}</p>
                              {backup.created_by && (
                                <p>Created by: {backup.created_by}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleDownloadBackup(backup.id)}
                              disabled={!backup.exists}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Download Backup"
                            >
                              <FaFileDownload className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRestoreBackup(backup.id)}
                              disabled={!backup.exists || restoringBackupId === backup.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Restore Backup"
                            >
                              <FaRedo className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(backup.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Backup"
                            >
                              <FaTrashAlt className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {restoringBackupId === backup.id && restoreConfirm && (
                          <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                            <p className="text-sm text-yellow-800 mb-2">
                              <strong>Warning:</strong> Restoring this backup will replace your department's current data. This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRestoreBackup(backup.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                              >
                                Confirm Restore
                              </button>
                              <button
                                onClick={() => {
                                  setRestoreConfirm(false);
                                  setRestoringBackupId(null);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-700">
            {user && user.role === 'admin' && user.department 
              ? `${user.department} Settings`
              : 'Settings'
            }
          </h1>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Tab Navigation for Department Admin */}
        {!isSuperAdmin() && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
