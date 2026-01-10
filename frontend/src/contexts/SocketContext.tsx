import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface IncomingCall {
  from: string;
  name: string;
  roomId: string;
}

interface SocketContextType {
  socket: Socket | null;
  socketRef: React.RefObject<Socket | null>;
  incomingCall: IncomingCall | null;
  acceptCall: () => void;
  declineCall: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const me = localStorage.getItem('userid') || (user ? String(user.userid) : '');

    if (!me) {
      console.log('[SocketContext] No user ID found, skipping socket initialization');
      return;
    }

    // Create a single persistent socket connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', async () => {
      console.log('[SocketContext] Socket connected globally');

      // Auto-join all friend DM rooms so we can receive call invites from any page
      try {
        const response = await api.post('/friends/list', { userid: me });
        const friends = response.data?.friends || [];

        console.log('[SocketContext] Auto-joining', friends.length, 'friend DM rooms');
        console.log('[SocketContext] Friends data:', friends);

        if (friends.length === 0) {
          console.warn('[SocketContext] No friends found');
          return;
        }

        friends.forEach((friend: any) => {
          console.log('[SocketContext] Processing friend:', friend);

          // Friend object has recipient and requester properties
          // Extract the friend who is NOT the current user
          let friendData = null;
          if (friend.requester?.userid === Number(me) || String(friend.requester?.userid) === String(me)) {
            friendData = friend.recipient;
          } else if (friend.recipient?.userid === Number(me) || String(friend.recipient?.userid) === String(me)) {
            friendData = friend.requester;
          }

          if (!friendData) {
            console.warn('[SocketContext] Could not determine friend from:', friend);
            return;
          }

          const friendId = friendData.userid || friendData.email || friendData.username;

          if (!friendId) {
            console.warn('[SocketContext] Friend has no valid ID:', friendData);
            return;
          }

          // Create deterministic room ID
          const parts = [me, String(friendId)].sort();
          const roomId = `dm:${parts.join('|')}`;
          console.log('[SocketContext] Joining room:', roomId, 'for friend:', friendData.username || friendData.name);

          newSocket.emit('joinRoom', roomId, me, (response: any) => {
            if (response?.ok) {
              console.log('[SocketContext] ✓ Successfully joined DM room:', roomId);
            } else {
              console.error('[SocketContext] ✗ Failed to join:', roomId, response);
            }
          });
        });
      } catch (error) {
        console.error('[SocketContext] Error fetching friends for auto-join:', error);
      }
    });

    // Global listener for incoming calls
    newSocket.on('webrtc-invite', (payload: any, from: string) => {
      if (from === me) {
        return; // Ignore our own invites
      }
      const callerName = payload && payload.name ? payload.name : String(from);
      const roomId = payload && payload.roomId ? payload.roomId : '';

      console.log('[SocketContext] Incoming call from', callerName, 'room:', roomId);
      setIncomingCall({ from, name: callerName, roomId });
    });

    newSocket.on('webrtc-decline', (_payload: any, from: string) => {
      if (from === me) return;
      // If we're the caller and someone declined, clear any incoming state
      setIncomingCall(null);
    });

    newSocket.on('disconnect', () => {
      console.log('[SocketContext] Socket disconnected');
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  const acceptCall = () => {
    if (!incomingCall || !socketRef.current) return;

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const me = localStorage.getItem('userid') || (user ? String(user.userid) : '');

    // Send accept signal
    socketRef.current.emit('webrtc-accept', incomingCall.roomId, { from: me }, me);

    // Extract friend email from roomId (format: dm:email1|email2)
    const roomId = incomingCall.roomId;
    if (roomId.startsWith('dm:')) {
      const parts = roomId.replace('dm:', '').split('|');
      // Find the other person's identifier
      const friendIdentifier = parts.find(p => p !== me && p !== String(user?.userid));

      if (friendIdentifier) {
        // Navigate to the chat page
        navigate(`/app/friends/chat/${encodeURIComponent(friendIdentifier)}`);
      }
    }

    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall || !socketRef.current) return;

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const me = localStorage.getItem('userid') || (user ? String(user.userid) : '');

    socketRef.current.emit('webrtc-decline', incomingCall.roomId, { from: me }, me);
    setIncomingCall(null);
  };

  return (
    <SocketContext.Provider value={{ socket, socketRef, incomingCall, acceptCall, declineCall }}>
      {children}
    </SocketContext.Provider>
  );
};
