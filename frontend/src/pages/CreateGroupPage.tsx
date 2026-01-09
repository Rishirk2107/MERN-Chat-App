import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface User {
  userid: number;
  username: string;
  name: string;
}

const CreateGroupPage: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.post('/users/list');
        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleUserChange = (identifier: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, identifier]);
    } else {
      setSelectedUsers(selectedUsers.filter(e => e !== identifier));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const email = user ? user.email : null;
    if (!email) {
      toast.error('Please login first');
      return;
    }
    try {
      await api.post('/rooms/create', { name: groupName, selectedEmails: selectedUsers, email });
      toast.success('Group created successfully');
      navigate('/rooms');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Error creating group');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 text-slate-100 p-6">
      <div className="w-full max-w-xl bg-white/5 rounded-xl p-8 shadow-lg backdrop-blur-md">
        <h1 className="text-2xl font-bold text-white mb-6">Create Group</h1>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            className="px-4 py-2 rounded bg-white/10 text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-200">Select Users:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map(user => (
                <label key={user.userid} className="flex items-center gap-2 bg-white/5 rounded p-2 cursor-pointer hover:bg-white/10">
                  <input
                    type="checkbox"
                    value={user.username}
                    onChange={(e) => handleUserChange(user.username, e.target.checked)}
                    className="accent-blue-600"
                  />
                  <span className="text-slate-100">{user.name} <span className="text-slate-400">({user.username})</span></span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-green-600 rounded text-white hover:bg-green-700">Create Group</button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupPage;
