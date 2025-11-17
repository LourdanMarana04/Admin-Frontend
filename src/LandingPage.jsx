import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo-seal.png'; 
import { FaSignInAlt } from 'react-icons/fa';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-6">
      <div className="bg-white/90 rounded-3xl shadow-2xl px-10 py-12 text-center max-w-xl w-full space-y-8 border border-blue-100">
        <img
          src={logo}
          alt="Cabuyao Logo"
          className="mx-auto w-36 h-36 object-contain rounded-full border-4 border-yellow-400 shadow-lg mb-2"
        />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 drop-shadow-sm">
          Welcome to the Cabuyao City Hall Queuing Management System
        </h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-yellow-600 tracking-wide mb-2">
          Admin Portal
        </h2>
        <p className="text-gray-700 text-base sm:text-lg mb-4">
          Manage your transactions efficiently and avoid the long queues.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-red-700 font-bold py-3 px-8 rounded-full shadow-lg flex items-center justify-center gap-2 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-300 mx-auto"
        >
          <FaSignInAlt className="inline-block text-lg" />
          Login / Sign Up
        </button>
      </div>
      <footer className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} Cabuyao City Hall. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
