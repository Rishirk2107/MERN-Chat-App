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
  const [messages, setMessages] = useState<any[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const me = localStorage.getItem('userid') || (user ? String(user.userid) : '') || '';
  const myName = (user ? (user.username || user.name) : '') || localStorage.getItem('username') || localStorage.getItem('name') || '';

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
        const loaded = data.messages.map((m: any) => ({ type: m.type || 'text', message: m.message, file: m.file, user: m.user, createdAt: m.createdAt, messageId: m.messageId, senderId: m.senderId, deliveredAt: m.deliveredAt, readAt: m.readAt }));
        setMessages(loaded);
        // mark messages as read for those not sent by me
        setTimeout(() => {
          loaded.forEach((m: any) => {
            try {
              if (m.messageId && String(m.senderId) !== String(me)) socketRef.current?.emit('messageRead', roomId, m.messageId, me);
            } catch (e) {}
          });
        }, 300);
      }
    }).catch(err => console.error('Error fetching DM messages', err));

    socketRef.current.on('message', (msg: any) => {
      if (!msg) return;
      const incoming = msg;
      setMessages(prev => {
        let replaced = false;
        const updated = prev.map((p) => {
          if (!p.messageId && p.message && incoming.message && p.message === incoming.message && String(p.user) === String(incoming.user)) {
            replaced = true;
            return incoming;
          }
          return p;
        });
        if (!replaced) updated.push(incoming);
        return updated;
      });

      try {
        const mid = incoming.messageId || incoming._id || null;
        if (mid) socketRef.current?.emit('messageReceived', roomId, mid, me);
      } catch (e) { }
    });

    socketRef.current.on('messageStatus', (status: any) => {
      if (!status || !status.messageId) return;
      setMessages(prev => prev.map(m => m.messageId === status.messageId ? { ...m, deliveredAt: status.deliveredAt, readAt: status.readAt } : m));
    });

    socketRef.current.on('typing', (payload: any) => {
      if (!payload || !payload.user) return;
      setTypingUser(payload.user);
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => setTypingUser(null), 2500);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [me, friend, roomId]);

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    setMessages(prev => [...prev, { type: 'text', message: message, user: myName }]);
    socketRef.current.emit('sendMessage', roomId, message, me);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full font-sans" style={{ background: 'var(--background, #0f172a)' }}>
      <div className="flex-1 overflow-auto px-0 py-6 md:px-8 md:py-8" style={{ minHeight: 0 }}>
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => {
            const author = msg.user || myName;
            const isMe = String(author) === String(myName);
            return (
              <ChatMessage key={i} text={msg.message} file={msg.file} author={author} isMe={isMe} deliveredAt={msg.deliveredAt} readAt={msg.readAt} />
            );
          })}
        </div>
      </div>
      {typingUser && String(typingUser) !== String(myName) ? (
        <div className="w-full text-sm text-slate-300 px-4 mb-2">{typingUser} is typing...</div>
      ) : null}
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-[#1f2933] shadow-lg rounded-xl mx-auto mb-4 max-w-2xl" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => { setMessage(e.target.value); socketRef.current?.emit('typing', roomId, myName); }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message"
          className="flex-1 bg-transparent text-[15px] text-slate-100 placeholder-slate-400 px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 transition"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        />
        <label className="flex items-center">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files && e.target.files[0];
              if (!f) return;
              const MAX = 20 * 1024 * 1024; // 20MB
              if (f.size > MAX) {
                alert('File too large. Maximum allowed size is 20 MB.');
                e.currentTarget.value = '';
                return;
              }
              try {
                setFileUploading(true);
                const form = new FormData();
                form.append('file', f);
                form.append('room', roomId);
                form.append('user', me);
                await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/file/upload', {
                  method: 'POST',
                  body: form,
                });
              } catch (err) {
                console.error('Upload error', err);
                alert('Upload failed');
              } finally {
                setFileUploading(false);
                e.currentTarget.value = '';
              }
            }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white" title="Upload file">
            {fileUploading ? 'Uploading...' : '📎'}
          </button>
        </label>
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
