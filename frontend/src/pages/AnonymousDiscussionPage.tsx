import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import api from '../utils/api';

const AnonymousDiscussionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const room = searchParams.get('room') || '';
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
    <div className="page">
      <h1>Anonymous Discussion: {room}</h1>
      <div className="messages">
        {messages.map((msg, index) => {
          const parts = msg.split(': ');
          const author = parts.shift() || '';
          const text = parts.join(': ');
          const me = author === localStorage.getItem('name');
          return (
            <div key={index} className={`message-row ${me ? 'me' : ''}`}>
              <div className={`bubble ${me ? 'me' : 'them'}`}>
                {text}
                <div className="msg-meta">{author}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="message-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message"
          className="text-gray-900 bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default AnonymousDiscussionPage;
