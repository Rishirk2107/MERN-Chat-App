import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Group {
  name: string;
  roomid: string;
}

const AddUserPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const modalGroup = params.get('group');

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      navigate('/login');
      return;
    }
    const fetchGroups = async () => {
      try {
        const response = await api.post('/admin/getrooms', { email });
        // keep only groups where current user is admin for AddUser
        const list = (response.data.rooms || []).filter((r: any) => r.admin === email);
        setGroups(list);
        // if opened as modal with group param, preselect it
        if (modalGroup) setSelectedGroup(modalGroup);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    fetchGroups();
  }, [navigate, modalGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem('email');
    if (!email) {
      toast.error('Please login first');
      return;
    }
    try {
      await api.post('/add-user', { username, groupId: selectedGroup, email });
      toast.success('User added successfully');
      navigate('/group-route');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Error adding user');
    }
  };

  // if modalGroup param present, render as modal overlay
  if (modalGroup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/60" onClick={() => navigate(-1)} />
        <div className="bg-slate-800 text-slate-100 rounded-lg shadow-lg w-full max-w-lg z-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add User</h3>
            <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-slate-100">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
            />
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} required className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100">
              <option value="" disabled>Select Group</option>
              {groups.map(group => (
                <option key={group.roomid} value={group.roomid}>{group.name}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <button type="button" onClick={() => navigate(-1)} className="px-3 py-1 border border-slate-600 rounded mr-2">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add User</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Add User to Group</h1>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} required>
          <option value="" disabled>Select Group</option>
          {groups.map(group => (
            <option key={group.roomid} value={group.roomid}>{group.name}</option>
          ))}
        </select>
        <button type="submit">Add User</button>
      </form>
    </div>
  );
};

export default AddUserPage;
