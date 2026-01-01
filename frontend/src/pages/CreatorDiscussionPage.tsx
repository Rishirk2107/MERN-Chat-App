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
    const email = localStorage.getItem('email');
    if (!email) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socketRef.current.emit('joinRoom', room, email);

    // Fetch existing messages
    api.post('/senddata', { roomid: room, email }).then(response => {
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
    const email = localStorage.getItem('email');
    const name = localStorage.getItem('name');
    if (!email || !name) return;

    if (message.trim() && socketRef.current) {
      setMessages(prev => [...prev, `${name}: ${message}`]);
      socketRef.current.emit('sendMessage', room, message, email);
      setMessage('');
    }
  };

  return (
    <div className="page">
      <h1>Creator Discussion: {room}</h1>
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
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default CreatorDiscussionPage;
