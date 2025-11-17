import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { getDepartmentIcon } from '../utils/departmentIcons';

const Departments = () => {
  const { isDarkMode } = useOutletContext();
  const { departments, loading } = useDepartments();
  const [resetting, setResetting] = useState({});
  const user = JSON.parse(localStorage.getItem('user'));

  let visibleDepartments = departments;
  if (user && user.role === 'admin' && user.department) {
    visibleDepartments = departments.filter(
      dept => dept.name.trim().toLowerCase() === user.department.trim().toLowerCase()
    );
  }

  const handleResetQueue = async (deptId) => {
    if (!window.confirm('Are you sure you want to reset the queue for this department?')) return;
    setResetting(prev => ({ ...prev, [deptId]: true }));
    try {
      await fetch(`http://localhost:8000/api/queue/reset/${deptId}`, {
        method: 'POST',
      });
      window.location.reload(); // Simple way to refresh queue data
    } catch (error) {
      alert('Failed to reset queue.');
    } finally {
      setResetting(prev => ({ ...prev, [deptId]: false }));
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading departments...</div>;
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-4xl font-bold ${
          isDarkMode ? 'text-red-400' : 'text-red-700'
        }`}>Departments</h1>
      </div>

      {/* Department Buttons */}
      <div className="flex flex-col items-center">
        <h2 className={`text-3xl font-semibold mb-10 text-center ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          Manage Department
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {visibleDepartments.filter(dept => dept.active !== false).map((dept) => {
            const IconComponent = getDepartmentIcon(dept.name);
            let routePath = `/departments/${encodeURIComponent(dept.name)}`;
            
            return (
              <Link
                key={dept.id}
                to={routePath}
                className="bg-blue-500 hover:bg-blue-700 focus:bg-blue-500 active:bg-transparent focus:outline-none text-white rounded-xl px-6 py-6 text-center font-semibold shadow transition duration-200 border-2 border-white relative"
              >
                <div className="flex flex-col items-center space-y-3">
                  <IconComponent className="text-3xl text-white" />
                  <span className="text-sm leading-tight">{dept.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Departments;