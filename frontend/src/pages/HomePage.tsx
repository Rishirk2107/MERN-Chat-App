import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const displayName = user ? (user.username || user.name) : null;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 text-slate-100">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-slate-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl">U</div>
            <div>
              <div className="font-semibold text-lg">MERN Chat</div>
              <div className="text-xs sm:text-sm text-slate-300">Real-time messaging</div>
            </div>
          </div>
          <div>
            {displayName ? (
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold text-sm">{String((displayName || 'U')[0]).toUpperCase()}</div>
                <div className="text-sm text-white hidden sm:block">{displayName}</div>
              </Link>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-700 transition">Login</Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl bg-white/5 rounded-xl p-4 sm:p-8 shadow-lg backdrop-blur-md">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">MERN Chat App</h1>
            <p className="text-xs sm:text-sm text-slate-200/90 mt-1">Fast, private, and simple group & private chats.</p>
          </div>

          <div className="text-slate-200 mb-6">
            <p className="mb-3 text-sm sm:text-base">Welcome to the MERN Chat App. Connect with friends, create groups, and enjoy real-time messaging with a clean, friendly interface.</p>
            <p className="text-xs sm:text-sm text-slate-300">Built with MongoDB, Express, React and Node. Use the app to chat privately or in groups — secure and simple.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button onClick={() => navigate('/app')} className="px-6 py-2 bg-green-500 rounded text-white text-sm sm:text-base shadow hover:bg-green-600 transition font-medium">Go to App</button>
            {!displayName && (
              <>
                <Link to="/signup" className="px-6 py-2 bg-transparent border border-slate-300 rounded text-white text-sm sm:text-base hover:bg-white/10 transition font-medium text-center">Sign Up</Link>
                <span className="text-xs sm:text-sm text-slate-300 hidden sm:inline">or</span>
                <Link to="/login" className="text-xs sm:text-sm text-slate-200/90 hover:underline text-center">login to continue</Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
