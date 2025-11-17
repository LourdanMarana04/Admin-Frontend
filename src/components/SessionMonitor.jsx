import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import sessionMonitor from '../utils/sessionMonitorService';

const SessionMonitor = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only start monitoring if user is logged in and not on login page
    const isLoggedIn = sessionMonitor.isLoggedIn();
    const isOnLoginPage = location.pathname === '/login';
    
    if (isLoggedIn && !isOnLoginPage) {
      // Start session monitoring
      sessionMonitor.startMonitoring(30000); // Check every 30 seconds

      // Add listener for session events
      const handleSessionEvent = (event) => {
        switch (event) {
          case 'account_deleted':
            console.log('Account deleted - redirecting to login');
            // The sessionMonitor will handle the redirect automatically
            break;
          case 'session_expired':
            console.log('Session expired - redirecting to login');
            navigate('/login');
            break;
          case 'no_token':
            console.log('No token found - redirecting to login');
            navigate('/login');
            break;
          case 'valid':
            // Session is valid, no action needed
            break;
          default:
            break;
        }
      };

      sessionMonitor.addListener(handleSessionEvent);

      // Cleanup function
      return () => {
        sessionMonitor.removeListener(handleSessionEvent);
        sessionMonitor.stopMonitoring();
      };
    } else if (!isLoggedIn && !isOnLoginPage) {
      // If not logged in and not on login page, redirect to login
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  // Also check session on route changes
  useEffect(() => {
    const isLoggedIn = sessionMonitor.isLoggedIn();
    const isOnLoginPage = location.pathname === '/login';
    
    if (!isLoggedIn && !isOnLoginPage) {
      navigate('/login');
    } else if (isLoggedIn && !isOnLoginPage) {
      // Perform a manual check when navigating to protected routes
      sessionMonitor.manualCheck();
    }
  }, [location.pathname, navigate]);

  return children;
};

export default SessionMonitor;


