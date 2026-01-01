import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Room {
  name: string;
  roomid: string;
}

const DeleteGroupPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      navigate('/login');
      return;
    }
    const fetchRooms = async () => {
      try {
        const response = await api.post('/group/showgroups', { email });
        setRooms(response.data.rooms || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
  }, [navigate]);

  const handleRoomChange = (roomid: string, checked: boolean) => {
    if (checked) {
      setSelectedRooms([...selectedRooms, roomid]);
    } else {
      setSelectedRooms(selectedRooms.filter(id => id !== roomid));
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await api.post('/group/delete', { selectedRooms });
      if (response.data.Message === true) {
        toast.success('Deleted Successfully');
        navigate('/group-route');
      }
    } catch (error) {
      console.error('Error deleting groups:', error);
      toast.error('Error deleting groups');
    }
  };

  return (
    <div className="page">
      <h2>Delete Groups</h2>
      <div className="checkbox-group">
        {rooms.map(room => (
          <label key={room.roomid}>
            <input
              type="checkbox"
              value={room.roomid}
              onChange={(e) => handleRoomChange(room.roomid, e.target.checked)}
            />
            {room.name}
          </label>
        ))}
      </div>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default DeleteGroupPage;
