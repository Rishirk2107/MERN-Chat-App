import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Group {
  name: string;
  roomid: string;
}

const AddUserPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem('email');
    if (!email) {
      alert('Please login first');
      return;
    }
    try {
      await api.post('/add-user', { username, groupId: selectedGroup, email });
      alert('User added successfully');
      navigate('/group-route');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    }
  };

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
