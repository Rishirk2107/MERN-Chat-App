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
    <div className="page">
      <h1>Create Group</h1>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
        <h3>Select Users:</h3>
        <div className="checkbox-group">
          {users.map(user => (
            <label key={user.userid}>
              <input
                type="checkbox"
                value={user.username}
                onChange={(e) => handleUserChange(user.username, e.target.checked)}
              />
              {user.name} ({user.username})
            </label>
          ))}
        </div>
        <button type="submit">Create Group</button>
      </form>
    </div>
  );
};

export default CreateGroupPage;
