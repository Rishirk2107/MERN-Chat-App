import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const displayName = user ? (user.username || user.name) : null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 text-slate-100">
      <aside className="hidden md:block w-72 bg-white/5 backdrop-blur-lg border-r border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl">U</div>
          <div>
            <div className="font-semibold text-lg">MERN Chat</div>
            <div className="text-sm text-slate-300">Real-time messaging</div>
          </div>
        </div>
        <div className="mt-6">
          <h5 className="text-sm text-slate-300 mb-2">Quick Links</h5>
          <Link to="/login" className="block mb-2 text-sm text-slate-100/90 hover:underline">Login</Link>
          <Link to="/signup" className="block text-sm text-slate-100/90 hover:underline">Signup</Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white/5 rounded-xl p-8 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">MERN Chat App</h1>
              <p className="text-sm text-slate-200/90 mt-1">Fast, private, and simple group & private chats.</p>
            </div>
            <div>
              {displayName ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">{String((displayName || 'U')[0]).toUpperCase()}</div>
                  <div className="text-sm text-white">{displayName}</div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login"><button className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700">Login</button></Link>
                  <Link to="/signup"><button className="px-4 py-2 bg-transparent border border-slate-300 rounded text-white">Signup</button></Link>
                </div>
              )}
            </div>
          </div>

          <div className="text-slate-200 mb-6">
            <p className="mb-3">Welcome to the MERN Chat App. Connect with friends, create groups, and enjoy real-time messaging with a clean, friendly interface.</p>
            <p className="text-sm text-slate-300">Built with MongoDB, Express, React and Node. Use the app to chat privately or in groups — secure and simple.</p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/app')} className="px-6 py-2 bg-green-500 rounded text-white shadow hover:bg-green-600">Go to App</button>
            {!displayName && (
              <Link to="/login" className="text-sm text-slate-200/90">Or login to continue</Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
