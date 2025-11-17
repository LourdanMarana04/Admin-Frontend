import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building,
  FileText,
  BarChart2,
  ClipboardList,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Users,
} from 'lucide-react';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import logo from '../assets/logo-seal.png';
import { useUser } from '../utils/UserContext';

const SuperAdminLayout = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user } = useUser();

  console.log('SuperAdminLayout rendered:', { user });

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const formattedTime = dateTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = dateTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });



  return (
    <div className={`relative flex h-screen font-sans transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-white'
    }`}>
      {/* Sidebar */}
      <aside className={`w-64 p-6 shadow-lg z-10 relative transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'
      } border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0`}>
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <img
              src={logo}
              alt="Logo"
              className="w-28 h-28 mx-auto mb-4 rounded-full shadow-md ring-2 ring-red-500/60"
            />

            {/* Super Admin Label */}
            <p className={`text-center font-extrabold text-base tracking-wide ${
              isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              Super Admin
            </p>
            {/* Display superadmin name and department */}
            {user && (
              <div className="text-center mb-2">
                <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>{user.department}</p>
              </div>
            )}
            <p className={`text-center text-xs font-medium mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              QUEUING MANAGEMENT SYSTEM
            </p>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              <NavItem to="/superdashboard" icon={<LayoutDashboard />} label="DASHBOARD" isDarkMode={isDarkMode} />
              <NavItem to="/superdepartments" icon={<Building />} label="DEPARTMENTS" isDarkMode={isDarkMode} />
              <NavItem to="/superreports" icon={<FileText />} label="REPORTS" isDarkMode={isDarkMode} />
              <NavItem to="/superanalytics" icon={<BarChart2 />} label="ANALYTICS" isDarkMode={isDarkMode} />
              <NavItem to="/supertransaction-purpose-analysis" icon={<ClipboardList />} label="TRANSACTION PURPOSE" isDarkMode={isDarkMode} />
              <NavItem to="/manage-admins" icon={<Users />} label="MANAGE ADMINS" isDarkMode={isDarkMode} />
              <NavItem to="/supersettings" icon={<SettingsIcon />} label="SETTINGS" isDarkMode={isDarkMode} />
            </nav>
          </div>

          {/* Logout Button */}
          <div className="mt-auto relative">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium outline-none transition-colors ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-800 hover:bg-gray-100 hover:text-gray-900'
              } focus-visible:ring-2 focus-visible:ring-red-500`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>

            {/* Logout Confirmation Dropdown */}
            {showLogoutConfirm && (
              <div className="absolute bottom-full mb-3 left-0 right-0 z-50">
                <div className={`rounded-lg shadow-xl p-4 relative transition-colors ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <h3 className={`font-bold mb-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                    Confirm Logout
                  </h3>
                  <p className={`mb-4 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Are you sure you want to logout?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-red-500 ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-700 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col rounded-l-3xl shadow-inner overflow-hidden relative z-0 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      } ${isDarkMode ? 'border-l border-gray-800' : 'border-l border-gray-200'}`}>
        {/* Header Bar */}
        <header
          className="flex justify-between items-center px-6 py-3 shadow-sm border-b border-red-600/40 transition-colors duration-300"
          style={{
            background: isDarkMode
              ? 'linear-gradient(90deg, #fca5a5, #f87171)' // soft gradient red (light mode)
              : 'linear-gradient(90deg,rgba(241, 86, 39, 0.86),rgb(230, 60, 60))', // deeper gradient red (dark mode)
          }}
        >
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-red-700" />
            <span>Super Admin</span>
          </div>
          <div className="flex items-center gap-4 text-gray-900">
            <div className="text-right text-sm leading-tight">
              <p className="font-semibold">{formattedTime}</p>
              <p>{formattedDate}</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                isDarkMode
                  ? 'bg-gray-900/40 hover:bg-gray-900/60'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-200" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </header>


        {/* Routed Page Content */}
        <section className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ isDarkMode }} />
        </section>
      </main>
    </div>
  );
};

// Reusable Navigation Link Component
const NavItem = ({ to, icon, label, isDarkMode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium outline-none transition-colors ${
        isActive
          ? isDarkMode
            ? 'bg-red-600 text-white shadow'
            : 'bg-red-600 text-white shadow'
          : isDarkMode
            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
            : 'text-gray-800 hover:bg-gray-100 hover:text-gray-900'
      } focus-visible:ring-2 focus-visible:ring-red-500`
    }
  >
    <span className="w-5 h-5">{icon}</span>
    <span className="text-inherit">{label}</span>
  </NavLink>
);

export default SuperAdminLayout;
