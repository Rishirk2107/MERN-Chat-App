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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100">
      <div className="bg-slate-800 rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-500 rounded-md flex items-center justify-center text-white font-bold text-2xl">{String((displayName || 'U')[0]).toUpperCase()}</div>
          <div>
            <div className="font-semibold text-lg">{displayName}</div>
            <div className="text-xs text-slate-300">{username}</div>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-sm text-slate-300 mb-2">Profile details</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-400">Name</div>
            <div className="text-slate-100">{displayName}</div>
            <div className="text-slate-400">Username</div>
            <div className="text-slate-100">{username || '—'}</div>
            <div className="text-slate-400">Email</div>
            <div className="text-slate-100">{email || '—'}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => navigate(-1)} className="px-3 py-1 border border-slate-600 rounded text-sm">Back</button>
          <button onClick={handleLogout} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
