import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AnonymousRedirectPage: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/anonymous-redirect', { roomName });
      navigate(`/anonymous-discussion?room=${encodeURIComponent(roomName)}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error joining room');
    }
  };

  return (
    <div className="page">
      <h1>Join Anonymous Room</h1>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          required
        />
        <button type="submit">Join Room</button>
      </form>
    </div>
  );
};

export default AnonymousRedirectPage;
