import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const DepartmentGeneric = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  const displayName = decodeURIComponent(name || '').replace(/-/g, ' ');
  const prefix = (displayName.split(' ')[0] || 'GEN').toUpperCase().substring(0, 3);

  const handleBack = () => {
    navigate('/departments');
  };

  const kioskUsers = Array.from({ length: 10 }, (_, i) => ({
    queue: `${prefix}#${i + 1}`,
    name: `Kiosk User ${i + 1}`,
  }));

  const webUsers = Array.from({ length: 10 }, (_, i) => ({
    queue: `${prefix}#${i + 11}`,
    name: `Web User ${i + 1}`,
  }));

  return (
    <div className="flex flex-row h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-red-700">{displayName.toUpperCase()} DEPARTMENT</h1>
          <button
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-300"
          >
            Back to Departments
          </button>
        </div>

        {/* Queue Monitoring */}
        <div className="bg-white p-6 rounded-lg shadow-lg relative">
          {/* Legend Box (One Line) */}
          <div className="absolute top-6 right-6 bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm shadow-md flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-blue-500 rounded-sm border border-blue-700"></span>
              <span>Priority</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-yellow-400 rounded-sm border border-yellow-600"></span>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-500 rounded-sm border border-green-700"></span>
              <span>Successful</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-red-500 rounded-sm border border-red-700"></span>
              <span>Failed</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <Link
              to="/transactionhistory"
              state={{ department: displayName.toLowerCase() }}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition duration-200"
            >
              View History
            </Link>
          </div>

          <div className="flex flex-row h-[500px] rounded-lg p-4 gap-6">
            {/* Kiosk Users */}
            <div className="flex-1 bg-white rounded-lg p-6 border border-gray-300 overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 text-center">KIOSK USERS</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kioskUsers.map((user, index) => {
                  let buttonStyle =
                    user.queue === `${prefix}#1`
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        navigate(`/nowserving/${encodeURIComponent(displayName)}/${user.queue}`, {
                          state: { queue: user.queue },
                        })
                      }
                      className={`text-lg font-semibold py-4 rounded-lg shadow transition duration-200 ${buttonStyle}`}
                    >
                      {user.queue}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Web Users */}
            <div className="flex-1 bg-white rounded-lg p-6 border border-gray-300 overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 text-center">WEB USERS</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {webUsers.map((user, index) => {
                  let buttonStyle =
                    user.queue === `${prefix}#11`
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        navigate(`/nowserving/${encodeURIComponent(displayName)}/${user.queue}`, {
                          state: { queue: user.queue },
                        })
                      }
                      className={`text-lg font-semibold py-4 rounded-lg shadow transition duration-200 ${buttonStyle}`}
                    >
                      {user.queue}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentGeneric; 