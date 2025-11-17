import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh user info from backend
  useEffect(() => {
    let interval;
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:8000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            setUser(data.data);
          }
        }
      } catch (err) {
        // Ignore errors for now
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
    interval = setInterval(fetchUser, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for profile update events to refresh user data immediately
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('Profile update event received in UserContext, refreshing user data...');
      refreshUser();
    };
    
    const handleStorage = (e) => {
      if (e.key === 'adminProfileUpdated') {
        console.log('Profile update detected via localStorage in UserContext, refreshing user data...');
        refreshUser();
      }
    };
    
    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('admin-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Add a manual refresh method for testing
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          setUser(data.data);
        }
      }
    } catch (err) {
      // Ignore errors for now
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext); 