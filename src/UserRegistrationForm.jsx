import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo-seal.png';
import cityhallImage from './assets/cityhall-logo.webp';

const UserRegistrationForm = () => {
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== retypePassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!username || !mobile || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          email,
          password,
          password_confirmation: retypePassword,
          role: 'user',
          position: mobile,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status === false) {
        setError(data.message || 'Registration failed.');
      } else {
        setSuccess('Registration successful! You can now log in.');
        setUsername('');
        setMobile('');
        setEmail('');
        setPassword('');
        setRetypePassword('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-100 to-yellow-100 px-4">
      <div className="flex gap-8 w-full max-w-6xl h-[90%]">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col rounded-xl border-2 border-gray-400 shadow-xl overflow-hidden">
          {/* Top Half with Gradient */}
          <div className="h-1/2 relative flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-transparent">
            <img src={logo} alt="Cabuyao Seal" className="w-40 h-40 mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-bold text-red-600 tracking-wide">USER REGISTRATION</h2>
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
            <div className="text-center mb-5">
              <h3 className="text-4xl font-bold text-blue-600 mb-1">Create User Account</h3>
              <p className="text-blue-600 text-lg">Fill in the details below</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-100 p-8 rounded-2xl border border-blue-300 shadow-sm max-w-[500px] mx-auto">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    USERNAME
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaPhone className="mr-2 text-blue-600" />
                    MOBILE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm"
                    placeholder="Enter your mobile number"
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
                    className="w-full max-w-[400px] px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FaLock className="mr-2 text-blue-600" />
                    PASSWORD
                  </label>
                  <div className="relative w-full max-w-[440px]">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm pr-20"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none outline-none text-gray-400 hover:text-blue-600 focus:outline-none"
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
                  <div className="relative w-full max-w-[440px]">
                    <input
                      type={showRetypePassword ? 'text' : 'password'}
                      value={retypePassword}
                      onChange={(e) => setRetypePassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm pr-20"
                      placeholder="Retype your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none outline-none text-gray-400 hover:text-blue-600 focus:outline-none"
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
                className={`w-full py-2 font-bold rounded-xl shadow-md transition duration-150 transform ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-yellow-400 hover:bg-yellow-500 hover:scale-105 text-black'
                }`}
              >
                {loading ? 'REGISTERING...' : 'REGISTER'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full mt-4 py-2 font-bold rounded-xl shadow-md bg-blue-500 hover:bg-blue-600 hover:scale-105 text-white transition duration-150 transform"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationForm; 