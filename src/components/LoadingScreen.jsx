import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ delayMs = 1500 }) => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Spinner - Three dots bouncing */}
        <div className="flex gap-2 h-8 items-center justify-center">
          <div
            className="w-3 h-3 bg-blue-500 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite',
              animationDelay: '0s'
            }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.2s'
            }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.4s'
            }}
          ></div>
        </div>

        {/* Loading Text */}
        <p className="text-gray-700 font-medium text-lg">Loading...</p>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          40% {
            transform: translateY(-16px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;