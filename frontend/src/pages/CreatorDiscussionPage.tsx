import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import api from '../utils/api';

const CreatorDiscussionPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const room = roomId || 'default-room';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userid = localStorage.getItem('userid') || (user ? String(user.userid) : '');
    if (!userid) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socketRef.current.emit('joinRoom', room, userid);

    // Fetch existing messages
    api.post('/senddata', { roomid: room, userid }).then(response => {
      const data = response.data;
      if (data.messages) {
        setMessages(data.messages.map((m: any) => `${m.user}: ${m.message}`));
      }
    }).catch(err => console.error('Error fetching messages', err));

    socketRef.current.on('message', (message: string, user: string) => {
      setMessages(prev => [...prev, `${user}: ${message}`]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [room]);

  const sendMessage = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userid = localStorage.getItem('userid') || (user ? String(user.userid) : '');
    const name = (user ? (user.name || user.username) : '') || localStorage.getItem('name');
    if (!userid || !name) return;

    if (message.trim() && socketRef.current) {
      setMessages(prev => [...prev, `${name}: ${message}`]);
      socketRef.current.emit('sendMessage', room, message, userid);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="messages h-[70vh] overflow-auto mb-4 space-y-3">
        {messages.map((msg, index) => {
          const parts = msg.split(': ');
          const author = parts.shift() || '';
          const text = parts.join(': ');
          const me = author === localStorage.getItem('name');
          return (
            <div key={index} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
              <div className={`${me ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100'} max-w-[70%] p-3 rounded-lg`}>
                <div>{text}</div>
                <div className="text-xs text-slate-300 mt-2 text-right">{author}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
  type="text"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
  placeholder="Type a message"
  className="flex-1 p-2 border rounded
             bg-white text-black
             placeholder-gray-400
             focus:outline-none focus:ring-2 focus:ring-blue-500"
/>

        <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-black rounded">Send</button>
      </div>
    </div>
  );
};

export default CreatorDiscussionPage;
