import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import api from '../utils/api';
import ChatMessage from '../components/ChatMessage';
import '../assets/styles.css';

const PrivateChatPage: React.FC = () => {
  const { friendEmail } = useParams<{ friendEmail: string }>();
  const friend = decodeURIComponent(friendEmail || '');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const me = localStorage.getItem('userid') || (user ? String(user.userid) : '') || '';
  const myName = (user ? (user.name || user.username) : '') || localStorage.getItem('name') || '';

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

    api.post('/senddata', { roomid: roomId, userid: me }).then(response => {
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
    <div className="flex flex-col h-full font-sans" style={{ background: 'var(--background, #0f172a)' }}>
      <div className="flex-1 overflow-auto px-0 py-6 md:px-8 md:py-8" style={{ minHeight: 0 }}>
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => {
            const parts = msg.split(': ');
            const author = parts.shift() || '';
            const text = parts.join(': ');
            const isMe = author === myName;
            return (
              <ChatMessage key={i} text={text} author={author} isMe={isMe} />
            );
          })}
        </div>
      </div>
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-[#1f2933] shadow-lg rounded-xl mx-auto mb-4 max-w-2xl" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message"
          className="flex-1 bg-transparent text-[15px] text-slate-100 placeholder-slate-400 px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        />
        <button
          onClick={sendMessage}
          className="p-2 rounded-full bg-cyan-700 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 flex items-center justify-center transition"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PrivateChatPage;
