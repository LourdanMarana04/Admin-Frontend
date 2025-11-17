import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
// Removed: import { api } from './utils/api';
import logo from '../src/assets/logo-seal.png';
import cityhallImage from '../src/assets/cityhall-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Replaced api.login with direct fetch
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('token', data.data.token);
      // Navigate based on role
      if (data.data.user.role === 'super_admin') {
        navigate('/superdashboard');
      } else if (data.data.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        // Redirect to login if role is not recognized
        setError('Invalid user role. Please contact administrator.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-fixed overflow-hidden">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${cityhallImage})`,
          zIndex: 0,
        }}
        aria-hidden
      />
      {/* red overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(185,28,28,0.15)', zIndex: 1 }}
        aria-hidden
      />

      {/* Top Section - Seal and Title */}
        <div className="relative z-10 flex flex-col items-center pt-8">
          <img src={logo} alt="Cabuyao Seal" className="w-32 h-32 drop-shadow-2xl" />
          <h1 className="text-4xl font-bold text-red-700 tracking-wide drop-shadow-2xl text-center mt-4">
            ADMIN PORTAL
          </h1>
        </div>

      {/* Centered Login Container */}
      <div className="relative z-10 flex items-center justify-center h-full mt-5 ">
        <div
          className="px-8 pt-5 pb-8 shadow-2xl w-full max-w-md mx-4 min-h-[28rem] flex flex-col justify-center"
          style={{
            background: 'rgba(133, 193, 243, 0.75)',
            backdropFilter: 'blur(2px)',
            border: '1px solid rgba(102, 102, 102, 0.6)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            borderRadius: '10px',
          }}
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-6 shadow-lg">
              {error}
            </div>
          )}

          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-black ">WELCOME BACK</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-lg"
              placeholder="Enter your email"
              required
              disabled={loading}
              style={{ borderRadius: '10px' }}
            />

            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-lg pr-12"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  style={{ borderRadius: '10px' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none outline-none text-gray-400 hover:text-blue-600 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  background: loading
                    ? 'gray'
                    : 'linear-gradient(to right, #FFD93D, #FFC300, #FFB100)',
                  color: 'black',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  transform: loading ? 'none' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background =
                      'linear-gradient(to right, #FFE066, #FFD43B, #FFC300)';
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background =
                      'linear-gradient(to right, #FFD93D, #FFC300, #FFB100)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  }
                }}
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
