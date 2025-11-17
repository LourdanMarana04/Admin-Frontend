import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../assets/logo-seal.png';
import cityhallImage from '../assets/cityhall-logo.webp';
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

const AdminRegistrationForm = ({ onRegister }) => {
  const { user: currentUser } = useUser();
  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
          <p className="text-gray-700">You do not have permission to register admin accounts. Only superadmins can access this page.</p>
        </div>
      </div>
    );
  }
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Enforce cityhall domain on frontend for better UX (backend also enforces)
    const cityhallEmail = /^[A-Za-z0-9._%+-]+@cityhall\.com$/i;
    if (!cityhallEmail.test(email)) {
      setError('Email must be a @cityhall.com address.');
      return;
    }
    
    if (password !== retypePassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!department) {
      setError('Please select a department.');
      return;
    }
    
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
          name: name,
          email: email,
          password: password,
          password_confirmation: retypePassword,
          role: 'admin',
          department: department,
          position: 'Department Admin',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.status) {
        setSuccess('Admin account created successfully!');
        if (onRegister) {
          onRegister({ name, email, department });
        }
        // Reset form
        setName('');
        setEmail('');
        setDepartment('');
        setPassword('');
        setRetypePassword('');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const firstError = data?.errors
          ? Object.values(data.errors).flat()[0]
          : null;
        setError(firstError || data.message || 'Failed to create admin account.');
      }
    } catch (err) {
      console.error('Error creating admin account:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-100 to-yellow-100 px-4">
      <div className="flex gap-8 w-full max-w-6xl h-[90%]">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col rounded-xl border-2 border-gray-400 shadow-xl overflow-hidden">
          {/* Top Half with Gradient */}
          <div className="h-1/2 relative flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-transparent">
            <img src={logo} alt="Cabuyao Seal" className="w-40 h-40 mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-bold text-red-600 tracking-wide">ADMIN REGISTRATION</h2>
          </div>
          {/* Bottom Half with City Hall Image */}
          <div
            className="h-1/2 bg-cover bg-center"
            style={{ backgroundImage: `url(${cityhallImage})` }}
          >
            <div className="h-full w-full bg-gradient-to-t from-white/0 to-blue-100/10" />
          </div>
        </div>
        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-gray-400 shadow-xl bg-white">
          <div className="w-full max-w-md px-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-4xl font-bold text-blue-600 mb-1">Create Admin Account</h3>
              <p className="text-blue-600 text-lg">Fill in the details below</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-100 p-5 rounded-lg border border-blue-300 shadow-sm">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm"
                    placeholder="Enter full name"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaEnvelope className="mr-2 text-blue-600" />
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm"
                    placeholder="Enter email address"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaBuilding className="mr-2 text-blue-600" />
                    DEPARTMENT
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm"
                    required
                    disabled={loading}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaLock className="mr-2 text-blue-600" />
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm pr-12"
                      placeholder="Enter password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none outline-none text-gray-400 hover:text-blue-600 focus:outline-none"
                      style={{ lineHeight: 0 }}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaLock className="mr-2 text-blue-600" />
                    RETYPE PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showRetypePassword ? 'text' : 'password'}
                      value={retypePassword}
                      onChange={(e) => setRetypePassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm pr-12"
                      placeholder="Retype password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none outline-none text-gray-400 hover:text-blue-600 focus:outline-none"
                      style={{ lineHeight: 0 }}
                      onClick={() => setShowRetypePassword((prev) => !prev)}
                      aria-label={showRetypePassword ? 'Hide password' : 'Show password'}
                    >
                      {showRetypePassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 font-bold rounded-xl shadow-md transition duration-150 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                }`}
              >
                {loading ? 'REGISTERING...' : 'REGISTER'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistrationForm; 