import React from 'react';
import { useNavigate } from 'react-router-dom';

const GroupRoutePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 text-slate-100 p-6">
      <div className="w-full max-w-xl bg-white/5 rounded-xl p-8 shadow-lg backdrop-blur-md">
        <h1 className="text-2xl font-bold text-white mb-6">Group Actions</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => navigate('/create-group')} className="px-6 py-3 bg-green-600 rounded text-white hover:bg-green-700">Create Group</button>
          <button onClick={() => navigate('/delete-group')} className="px-6 py-3 bg-red-600 rounded text-white hover:bg-red-700">Delete Group</button>
          <button onClick={() => navigate('/add-user')} className="px-6 py-3 bg-blue-600 rounded text-white hover:bg-blue-700">Add User</button>
          <button onClick={() => navigate('/remove-users')} className="px-6 py-3 bg-yellow-600 rounded text-white hover:bg-yellow-700">Remove Users</button>
          <button onClick={() => navigate('/anonymous-create')} className="px-6 py-3 bg-purple-600 rounded text-white hover:bg-purple-700 col-span-1 sm:col-span-2">Anonymous Chats</button>
        </div>
      </div>
    </div>
  );
};

export default GroupRoutePage;
