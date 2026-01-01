import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface User {
  email: string;
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
        const response = await api.post('/addUsers');
        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

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
      await api.post('/submitUsers', { name: groupName, selectedEmails: selectedUsers, email });
      alert('Group created successfully');
      navigate('/rooms');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group');
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
        <button type="submit">Create Group</button>
      </form>
    </div>
  );
};

export default CreateGroupPage;
