import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Group {
  name: string;
  roomid: string;
}

interface User {
  name: string;
  email: string;
}

const RemoveUsersPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const modalGroup = params.get('group');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const email = user ? user.email : null;
    if (!email) {
      navigate('/login');
      return;
    }
    const fetchGroups = async () => {
      try {
            const response = await api.post('/admin/rooms', { userid: user.userid });
        // only include admin groups for remove-users flow
        const list = (response.data.rooms || []).filter((r: any) => r.admin === user.userid);
        setGroups(list);
        // preselect group from query param if provided
        const q = modalGroup;
        if (q) setSelectedGroup(q);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    fetchGroups();
  }, [navigate, modalGroup]);

  useEffect(() => {
    if (selectedGroup) {
      const fetchUsers = async () => {
        try {
              const response = await api.post('/admin/rooms/users', { roomId: selectedGroup });
          setUsers(response.data.Users);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
    }
  }, [selectedGroup]);

  const handleUserChange = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, email]);
    } else {
      setSelectedUsers(selectedUsers.filter(e => e !== email));
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
      await api.post('/groups/remove-members', { userIds: selectedUsers, groupId: selectedGroup, userid: user.userid });
      toast.success('Users removed successfully');
      // if opened as modal, go back, otherwise navigate to group route
      if (modalGroup) navigate(-1);
      else navigate('/group-route');
    } catch (error) {
      console.error('Error removing users:', error);
      toast.error('Error removing users');
    }
  };

  // if opened with ?group=..., render as modal
  if (modalGroup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/60" onClick={() => navigate(-1)} />
        <div className="bg-slate-800 text-slate-100 rounded-lg shadow-lg w-full max-w-xl z-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Remove Users</h3>
            <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-slate-100">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} required className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100">
              <option value="">Select Group</option>
              {groups.map(group => (
                <option key={group.roomid} value={group.roomid}>{group.name}</option>
              ))}
            </select>
            <h3 className="text-sm">Select Users to Remove:</h3>
            <div className="grid gap-2 max-h-56 overflow-auto">
              {users.map(user => (
                <label key={user.email} className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-700">
                  <input
                    type="checkbox"
                    value={user.email}
                    onChange={(e) => handleUserChange(user.email, e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>{user.name}</div>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => navigate(-1)} className="px-3 py-1 border border-slate-600 rounded mr-2">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Remove Selected Users</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
      <div className="page">
      <h1>Remove Users from Group</h1>
      <form className="form-container" onSubmit={handleSubmit}>
        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} required>
          <option value="">Select Group</option>
          {groups.map(group => (
            <option key={group.roomid} value={group.roomid}>{group.name}</option>
          ))}
        </select>
        <h3>Select Users to Remove:</h3>
        <div className="checkbox-group">
          {users.map(user => (
            <label key={user.email}>
              <input
                type="checkbox"
                value={user.email}
                onChange={(e) => handleUserChange(user.email, e.target.checked)}
              />
              {user.name}
            </label>
          ))}
        </div>
        <button type="submit">Remove Selected Users</button>
      </form>
    </div>
  );
};

export default RemoveUsersPage;
