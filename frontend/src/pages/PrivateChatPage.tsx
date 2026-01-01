import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import api from '../utils/api';
import '../assets/styles.css';

const PrivateChatPage: React.FC = () => {
  const { friendEmail } = useParams<{ friendEmail: string }>();
  const friend = decodeURIComponent(friendEmail || '');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const me = localStorage.getItem('email') || '';
  const myName = localStorage.getItem('name') || '';

  // deterministic room id for DM
  const roomId = React.useMemo(() => {
    const a = me;
    const b = friend;
    const parts = [a, b].sort();
    return `dm:${parts.join('|')}`;
  }, [me, friend]);

  useEffect(() => {
    if (!me || !friend) return;
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    socketRef.current.emit('joinRoom', roomId, me);

    api.post('/senddata', { roomid: roomId, email: me }).then(response => {
      const data = response.data;
      if (data.messages) {
        setMessages(data.messages.map((m: any) => `${m.user}: ${m.message}`));
      }
    }).catch(err => console.error('Error fetching DM messages', err));

    socketRef.current.on('message', (msg: string, user: string) => {
      setMessages(prev => [...prev, `${user}: ${msg}`]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [me, friend, roomId]);

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    setMessages(prev => [...prev, `${myName}: ${message}`]);
    socketRef.current.emit('sendMessage', roomId, message, me);
    setMessage('');
  };

  return (
    <div className="page">
      <h1>Chat with {friend}</h1>
      <div className="messages">
        {messages.map((msg, i) => {
          const parts = msg.split(': ');
          const author = parts.shift() || '';
          const text = parts.join(': ');
          const isMe = author === myName;
          return (
            <div key={i} className={`message-row ${isMe ? 'me' : ''}`}>
              <div className={`bubble ${isMe ? 'me' : 'them'}`}>
                {text}
                <div className="msg-meta">{author}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="composer">
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message" />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default PrivateChatPage;
