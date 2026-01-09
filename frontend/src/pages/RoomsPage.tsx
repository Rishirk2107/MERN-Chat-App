import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../assets/styles.css';

type Room = { name: string; roomid: string };

const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userid = localStorage.getItem('userid') || (user ? String(user.userid) : '');
    if (!userid) {
      navigate('/login');
      return;
    }
    const fetchRooms = async () => {
      try {
        const response = await api.post('/rooms/user', { userid });
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 text-slate-100 p-6">
      <div className="w-full max-w-xl bg-white/5 rounded-xl p-8 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Group Chats</h2>
          <button onClick={() => navigate('/create-group')} className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700">+ New Group</button>
        </div>
        <div className="flex flex-col gap-4">
          {rooms.length === 0 && <div className="text-slate-300">No groups found.</div>}
          {rooms.map(r => (
            <button key={r.roomid} className="flex items-center gap-4 p-4 rounded-lg bg-white/10 hover:bg-white/20 transition text-left" onClick={() => openRoom(r.roomid)}>
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-lg">{(r.name || 'G')[0]?.toUpperCase()}</div>
              <div className="text-lg text-slate-100">{r.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
