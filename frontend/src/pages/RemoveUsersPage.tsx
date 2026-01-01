import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

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

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      navigate('/login');
      return;
    }
    const fetchGroups = async () => {
      try {
        const response = await api.post('/admin/getrooms', { email });
        setGroups(response.data.rooms);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    fetchGroups();
  }, [navigate]);

  useEffect(() => {
    if (selectedGroup) {
      const fetchUsers = async () => {
        try {
          const response = await api.post('/admin/remUsers', { roomId: selectedGroup });
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
    const email = localStorage.getItem('email');
    if (!email) {
      alert('Please login first');
      return;
    }
    try {
      await api.post('/remove-users', { userIds: selectedUsers, groupId: selectedGroup, email });
      alert('Users removed successfully');
      navigate('/group-route');
    } catch (error) {
      console.error('Error removing users:', error);
      alert('Error removing users');
    }
  };

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
