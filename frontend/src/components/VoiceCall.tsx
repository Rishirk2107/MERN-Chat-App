import React, { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

type Props = {
  socketRef: React.RefObject<Socket | null>;
  roomId: string;
  me: string;
  myName: string;
};

const STUN_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

const VoiceCall: React.FC<Props> = ({ socketRef, roomId, me, myName }) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [calling, setCalling] = useState(false);
  // const [debug, setDebug] = useState<string[]>([]);

  useEffect(() => {
    // let attachedSocket: Socket | null = null;
    let pollTimer: any = null;
    let roomJoined = false;

    const attachHandlers = (socket: Socket) => {
      // attachedSocket = socket;
      
      // Auto-join the room so receiver can receive invites
      if (!roomJoined) {
        socket.emit('joinRoom', roomId, me, () => {
          roomJoined = true;
        });
        // Log if callback doesn't fire within 3 seconds
        setTimeout(() => {
          if (!roomJoined) {
            console.warn('[VoiceCall] WARNING: joinRoom callback not called after 3s. Socket connected:', socket.connected);
          }
        }, 3000);
      }

      const onOffer = async (offer: any, from: string) => {
        if (from === me) return;
        await ensurePeerConnection();
        try {
          await pcRef.current!.setRemoteDescription(offer);
          const answer = await pcRef.current!.createAnswer();
          await pcRef.current!.setLocalDescription(answer);
          socket.emit('webrtc-answer', roomId, answer, me);
          setInCall(true);
          setCalling(false);
        } catch (err) {
          console.error('Error handling offer', err);
        }
      };

      const onInvite = (payload: any, from: string) => {
        if (from === me) {
          return;
        }
        const callerName = payload && payload.name ? payload.name : String(from);
        setIncoming({ from, name: callerName });

      };

      const onAccept = async (from: string) => {
        // the other user accepted our invite -> we should create offer
        if (from === me) return;
        try {
          const pc = await ensurePeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', roomId, offer, me);
          setInCall(true);
          setCalling(false);
        } catch (err) {
          console.error('Error creating offer after accept', err);
        }
      };

      const onDecline = (from: string) => {
        if (from === me) return;
        // remote declined our invite
        setIncoming(null);
        setCalling(false);
        alert('Call declined');
      };

      const onAnswer = async (answer: any, from: string) => {
        if (from === me) return;
        try {
          await pcRef.current?.setRemoteDescription(answer);
          setInCall(true);
          setCalling(false);
        } catch (err) {
          console.error('Error applying answer', err);
        }
      };

      const onIce = async (candidate: any, from: string) => {
        if (from === me) return;
        try {
          if (candidate) await pcRef.current?.addIceCandidate(candidate);
        } catch (err) {
          console.error('Error adding remote ICE', err);
        }
      };

      const onHangup = (from: string) => {
        if (from === me) return;
        // If receiver has incoming call but not yet inCall, clear incoming UI
        if (!inCall && incoming) {
          setIncoming(null);
          setCalling(false);
          return;
        }
        endCall();
        setCalling(false);

      };
      socket.on('webrtc-offer', onOffer);
      socket.on('webrtc-answer', onAnswer);
      socket.on('webrtc-ice', onIce);
      socket.on('webrtc-hangup', onHangup);
      socket.on('webrtc-invite', onInvite);
      socket.on('webrtc-accept', onAccept);
      socket.on('webrtc-decline', onDecline);

      return () => {
        try {
          socket.off('webrtc-offer', onOffer);
          socket.off('webrtc-answer', onAnswer);
          socket.off('webrtc-ice', onIce);
          socket.off('webrtc-hangup', onHangup);
          socket.off('webrtc-invite', onInvite);
          socket.off('webrtc-accept', onAccept);
          socket.off('webrtc-decline', onDecline);
        } catch (e) {}
      };
    };

    const tryAttach = () => {
      const s = socketRef.current;
      
      if (s) {
        attachHandlers(s);
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }
    };

    // try immediate attach
    tryAttach();
    // if not attached yet, poll briefly (5s)
    if (!socketRef.current) {
      let attempts = 0;
      pollTimer = setInterval(() => {
        attempts += 1;
        if (socketRef.current) {
          tryAttach();
        }
        if (attempts > 25) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }, 200);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      const s = socketRef.current;
      if (s) {
        try {
          s.off('webrtc-offer');
          s.off('webrtc-answer');
          s.off('webrtc-ice');
          s.off('webrtc-hangup');
          s.off('webrtc-invite');
          s.off('webrtc-accept');
          s.off('webrtc-decline');
        } catch (e) {}
      }
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef, roomId, me]);

  const ensurePeerConnection = async () => {
    if (pcRef.current) {
      return pcRef.current;
    }
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-ice', roomId, e.candidate, me);
      }
    };

    pc.ontrack = (e) => {
      try {
        const [stream] = e.streams;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      } catch (err) {
        console.error('ontrack error', err);
      }
    };

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      if (muted) localStream.getAudioTracks().forEach(t => t.enabled = false);
    } catch (err) {
      console.error('getUserMedia failed', err);
      throw err;
    }

    return pc;
  };

  const startCall = async () => {
    if (!socketRef.current) {
      console.warn('startCall: socketRef.current is null');
      return alert('Socket not connected');
    }
    const sock = socketRef.current;
    if (typeof (sock as any).connected !== 'undefined' && !(sock as any).connected) {
      console.warn('startCall: socket exists but not connected', sock);
      return alert('Socket disconnected');
    }
    try {
      setCalling(true);
      // Always join the room before sending invite to ensure backend relays signaling
      await new Promise<void>((resolve) => {
        sock.emit('joinRoom', roomId, me, () => {
          resolve();
        });
        // Fallback in case callback never fires
        setTimeout(() => resolve(), 2000);
      });
      sock.emit('webrtc-invite', roomId, { name: myName }, me);
    } catch (err) {
      console.error('startCall invite error', err);
      alert('Unable to send call invite');
      setCalling(false);
    }
  };

  const endCall = () => {
    try {
      pcRef.current?.getSenders().forEach(s => { try { s.track?.stop(); } catch(e){} });
      pcRef.current?.close();
    } catch (err) {
    }
    pcRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    // Only emit hangup if we are in a call or calling
    if ((inCall || calling) && socketRef.current) {
      socketRef.current.emit('webrtc-hangup', roomId, me);
    }
    setInCall(false);
    setCalling(false);
    setIncoming(null);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const enabled = !muted;
    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !enabled ? true : false);
    setMuted(!muted);
  };

  const [incoming, setIncoming] = useState<{ from: string; name: string } | null>(null);

  const acceptCall = async () => {
    if (!socketRef.current) {
      return;
    }
    try {
      await ensurePeerConnection();
      // notify caller that we accept — caller will create offer
      socketRef.current.emit('webrtc-accept', roomId, { from: me }, me);
      setIncoming(null);
    } catch (err) {
      console.error('acceptCall error', err);
    }
  };

  const declineCall = () => {
    if (!socketRef.current || !incoming) {
      return;
    }
    socketRef.current.emit('webrtc-decline', roomId, { from: me }, me);
    setIncoming(null);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <audio ref={remoteAudioRef} autoPlay />

      {incoming ? (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-yellow-500 text-black rounded">Incoming call from {incoming.name}</div>
          <button onClick={acceptCall} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>
          <button onClick={declineCall} className="px-3 py-1 bg-red-600 text-white rounded">Decline</button>
        </div>
      ) : null}
      {!inCall ? (
        <>
          {calling ? (
            <>
              <div className="px-3 py-1 bg-blue-500 text-white rounded">Calling...</div>
              <button onClick={endCall} className="px-3 py-1 bg-red-600 text-white rounded ml-2">Hang Up</button>
            </>
          ) : (
            <button onClick={startCall} className="px-3 py-1 bg-green-600 text-white rounded">Start Call</button>
          )}
        </>
      ) : (
        <>
          <button onClick={endCall} className="px-3 py-1 bg-red-600 text-white rounded">Hang Up</button>
          <button onClick={toggleMute} className="px-3 py-1 bg-slate-700 text-white rounded">{muted ? 'Unmute' : 'Mute'}</button>
        </>
      )}
    </div>
  );
};

export default VoiceCall;
