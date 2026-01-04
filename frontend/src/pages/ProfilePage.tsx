import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userid');
    } catch (e) { /* ignore */ }
    navigate('/login');
  };

  const displayName = user ? (user.name || user.username || 'Unknown') : 'Unknown';
  const username = user ? (user.username || '') : '';
  const email = user ? (user.email || '') : '';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-5xl mx-auto w-full px-6 py-12">
        <div className="bg-slate-800 rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-start md:gap-8">
            <div className="flex-shrink-0 mb-6 md:mb-0">
              <div className="w-28 h-28 bg-indigo-500 rounded-md flex items-center justify-center text-white font-bold text-3xl">{String((displayName || 'U')[0]).toUpperCase()}</div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-semibold">{displayName}</div>
                  <div className="text-sm text-slate-400 mt-1">{username || '—'}</div>
                </div>
                <div className="mt-1 md:mt-0 flex gap-3">
                  <button onClick={() => navigate(-1)} className="px-3 py-1 border border-slate-600 rounded text-sm bg-transparent">Back</button>
                  <button onClick={handleLogout} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Logout</button>
                </div>
              </div>

              <div className="mt-8">
                <div className="text-sm text-slate-300 mb-4">Profile details</div>
                <div className="grid grid-cols-2 gap-4 max-w-xl text-sm">
                  <div className="text-slate-400">Name</div>
                  <div className="text-slate-100">{displayName}</div>
                  <div className="text-slate-400">Username</div>
                  <div className="text-slate-100">{username || '—'}</div>
                  <div className="text-slate-400">Email</div>
                  <div className="text-slate-100">{email || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
