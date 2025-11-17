import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaDownload, FaTrashAlt, FaRedo, FaDatabase, FaFileDownload } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8000/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const SuperSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [accounts, setAccounts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  // Super admin profile state
  const [superAdminName, setSuperAdminName] = useState('');
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Backup & Restore state
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [backupSuccess, setBackupSuccess] = useState('');
  const [restoringBackupId, setRestoringBackupId] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState(false);

  // System announcement state
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementTargets, setAnnouncementTargets] = useState({
    admin: true,
  });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementError, setAnnouncementError] = useState('');

  useEffect(() => {
    if (activeTab === 'security') {
      fetchAccounts();
    }
    if (activeTab === 'profile') {
      fetchSuperAdminProfile();
    }
    if (activeTab === 'backup') {
      fetchBackups();
    }
    // Listen for admin profile updates
    const handleProfileUpdate = () => {
      if (activeTab === 'security') fetchAccounts();
    };
    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    const handleStorage = (e) => {
      if (e.key === 'adminProfileUpdated' && activeTab === 'security') fetchAccounts();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('admin-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorage);
    };
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchSuperAdminProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSuperAdminName(data.data.name || '');
        setSuperAdminEmail(data.data.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveSuperAdminProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: superAdminName,
          email: superAdminEmail,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        console.log('Superadmin profile update successful:', updatedUser);
        
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(updatedUser.user));
        
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3000);
        
        // Update localStorage for cross-tab communication - this will trigger storage event in other tabs
        const updateData = {
          userId: updatedUser.user.id,
          timestamp: Date.now(),
          action: 'profile_updated',
          userRole: 'super_admin'
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
        setProfileError(errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.filter(u => u.role === 'admin'));
      }
    } catch (error) {
      // handle error
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleEdit = (user) => {
    setEditId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setEditPasswordConfirm('');
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSave = async () => {
    setEditError('');
    setEditSuccess('');
    if (editPassword || editPasswordConfirm) {
      if (editPassword !== editPasswordConfirm) {
        setEditError('Passwords do not match.');
        return;
      }
      if (editPassword.length < 8) {
        setEditError('Password must be at least 8 characters.');
        return;
      }
    }
    try {
      const body = { name: editName, email: editEmail };
      if (editPassword) {
        body.password = editPassword;
        body.password_confirmation = editPasswordConfirm;
      }
      const response = await fetch(`${API_BASE_URL}/users/${editId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (response.ok) {
        setAccounts(accounts.map(u => u.id === editId ? { ...u, name: editName, email: editEmail } : u));
        setEditSuccess(editPassword ? 'Password changed successfully!' : 'Account updated successfully!');
        setEditPassword('');
        setEditPasswordConfirm('');
        setTimeout(() => setEditSuccess(''), 3000);
        // Don't close the edit form immediately so user can see the message
      } else {
        const errorData = await response.json();
        setEditError(errorData.message || 'Failed to update account.');
      }
    } catch (error) {
      setEditError('Failed to update account.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin account?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setAccounts(accounts.filter(u => u.id !== id));
      }
    } catch (error) {
      // handle error
    }
  };

  const handleBack = () => {
    navigate('/superdashboard');
  };

  const handleSignOut = () => {
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
        setBackups(data.data || []);
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
      const response = await fetch(`${API_BASE_URL}/backup/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

    if (!window.confirm('WARNING: This will replace all current data with the backup data. This action cannot be undone. Are you absolutely sure?')) {
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
        setBackupSuccess('Database restored successfully!');
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Super Admin Profile Settings</h3>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-md font-semibold mb-2 text-blue-800">
                  System Administrator
                </h4>
                <p className="text-sm text-blue-700">
                  Manage your super admin profile and system-wide settings.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={superAdminName}
                    onChange={(e) => setSuperAdminName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    value="Super Administrator"
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    You have full system administrative privileges.
                  </p>
                </div>
                <button
                  onClick={handleSaveSuperAdminProfile}
                  disabled={profileLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">System Title</label>
                  <input
                    type="text"
                    placeholder="System Title (e.g., Cabuyao QMS)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This title will appear throughout the system interface.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Asia/Manila (UTC+8)</option>
                    <option>Asia/Singapore (UTC+8)</option>
                    <option>UTC (UTC+0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Format</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        );
      case 'departments':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Department Management</h3>
              
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-md font-semibold mb-2 text-yellow-800">
                  Department Configuration
                </h4>
                <p className="text-sm text-yellow-700">
                  Enable or disable departments that will be available in the system.
                </p>
              </div>

              <div className="space-y-3">
                {['Treasury', 'Assessor', 'Tax Mapping', 'HRM', 'City Mayor'].map((dept, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-4 border border-gray-300 rounded-md bg-gray-50"
                  >
                    <div className="flex-1">
                      <span className="text-gray-800 font-medium">{dept}</span>
                      <p className="text-sm text-gray-500">Department operations and services</p>
                    </div>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                ))}
              </div>

              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
                Save Department Settings
              </button>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
              
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/view-created-notifications')}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  View Created Notifications
                </button>
              </div>
            </div>

            <div className="border border-blue-200 rounded-lg p-6 bg-blue-50/60">
              <h4 className="text-md font-semibold mb-3 text-blue-800">
                Maintenance & Service Announcements
              </h4>
              <p className="text-sm text-blue-700 mb-4">
                Send real-time notices to kiosk screens and the web kiosk when services are down, under maintenance, or restored.
              </p>

              {announcementSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {announcementSuccess}
                </div>
              )}
              {announcementError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {announcementError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">
                    Announcement Message
                  </label>
                  <textarea
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    rows={5}
                    placeholder="Example: We’re performing emergency maintenance. Services will be back by 3:00 PM."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Quick Fill Templates
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Emergency maintenance in progress. Some services are temporarily unavailable.',
                        'Scheduled maintenance starting soon. Please finish current transactions.',
                        'Services have been fully restored. Thank you for your patience.',
                      ].map((template, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setAnnouncementMessage(template)}
                          className="px-3 py-1.5 text-xs bg-white border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition"
                        >
                          Use: {template.slice(0, 32)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <fieldset className="border border-blue-200 rounded-md p-4 bg-white">
                    <legend className="text-sm font-semibold text-blue-800 px-1">
                      Target Channels
                    </legend>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementTargets.admin}
                        onChange={(e) =>
                          setAnnouncementTargets((prev) => ({ ...prev, admin: e.target.checked }))
                        }
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Admin</p>
                        <p className="text-xs text-gray-500">
                          Sends notifications to all department administrators.
                        </p>
                      </div>
                    </label>
                  </fieldset>

                  <div className="bg-white border border-blue-200 rounded-md p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Tips</p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      <li>Mention the expected completion time when possible.</li>
                      <li>Send a follow-up “Services restored” notice once maintenance is done.</li>
                      <li>Keep messages under 240 characters for best readability.</li>
                    </ul>
                  </div>


                </div>
              </div>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Restore</h3>
              
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-md font-semibold mb-2 text-yellow-800">
                  <FaDatabase className="inline mr-2" />
                  Full System Backup
                </h4>
                <p className="text-sm text-yellow-700">
                  Create, download, and restore full system backups. This includes all departments, transactions, queue numbers, and user data.
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
                  {creatingBackup ? 'Creating Backup...' : 'Create Full System Backup'}
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
                              <strong>Warning:</strong> Restoring this backup will replace all current data. This action cannot be undone.
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-700">Super Admin Settings</h1>
        </div>

        {/* Success/Error Messages */}
        {profileSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {profileError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'profile', label: 'Profile Settings' },
              { key: 'system', label: 'System Preferences' },
              { key: 'departments', label: 'Department Management' },
              { key: 'notifications', label: 'Notification Settings' },
              { key: 'backup', label: 'Backup & Restore' },
            ].map((tab) => (
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

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SuperSettings;
