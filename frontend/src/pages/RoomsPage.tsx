import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../assets/styles.css';

type Room = { name: string; roomid: string };

const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      navigate('/login');
      return;
    }
    const fetchRooms = async () => {
      try {
        const response = await api.post('/getRooms', { email });
        const data = response.data;
        const roomsData = data.userRooms || data;
        if (Array.isArray(roomsData)) {
          setRooms(roomsData);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
  }, [navigate]);

  const openRoom = (roomid: string) => {
    navigate(`/group/room/${roomid}`);
  };

  return (
    <div className="page">
      <h2>Group Chats</h2>
      <div>
        {rooms.length === 0 && <p>No rooms found.</p>}
        {rooms.map(r => (
          <button key={r.roomid} className="room-button" onClick={() => openRoom(r.roomid)}>
            {r.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomsPage;
