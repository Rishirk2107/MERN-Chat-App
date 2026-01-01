import React from 'react';
import { useNavigate } from 'react-router-dom';

const GroupRoutePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>Group Route</h1>
      <button onClick={() => navigate('/create-group')}>Create Group</button>
      <button onClick={() => navigate('/delete-group')}>Delete Group</button>
      <button onClick={() => navigate('/add-user')}>Add User</button>
      <button onClick={() => navigate('/remove-users')}>Remove Users</button>
      <button className="anonymous-chats" onClick={() => navigate('/anonymous-create')}>Anonymous Chats</button>
    </div>
  );
};

export default GroupRoutePage;
