const { Room, User, Message, Friend } = require('../../model/dbmodel');
const { resolveUserIdentifier } = require('../../libs/helpers/helpers');

module.exports = function initSockets(io) {
  io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('joinRoom', async (room, user, cb) => {
      try {
        const result = await Room.findOne({ roomid: room });
        let userIdentifier = user;
        if (user && typeof user === 'object') {
          userIdentifier = user.userid || user.email || user.username || user.id || JSON.stringify(user);
        }
        const userId = await resolveUserIdentifier(userIdentifier);
        try { socket.data = socket.data || {}; socket.data.userid = userId; } catch(e){}
        if (result) {
          if (userId != null && (result.admin === userId || result.users.includes(userId))) {
            socket.join(room);
            console.log(`User ${userId} joined room ${room}`);
            if (typeof cb === 'function') cb({ ok: true });
          } else {
            console.log('Unauthorised Access for', user, 'in room', room);
            if (typeof cb === 'function') cb({ ok: false, reason: 'unauthorised' });
          }
        } else {
          if (room.startsWith('dm:')) {
            const parts = room.replace('dm:', '').split('|');
            if (parts.length === 2) {
              const [a, b] = parts;
              const aId = await resolveUserIdentifier(a);
              const bId = await resolveUserIdentifier(b);
              if (userId === aId || userId === bId) {
                const friend = await Friend.findOne({
                  $or: [
                    { 'requester.userid': aId, 'recipient.userid': bId },
                    { 'requester.userid': bId, 'recipient.userid': aId }
                  ],
                  status: 'accepted'
                });
                if (friend) {
                  socket.join(room);
                  console.log(`User ${userId} joined DM room ${room}`);
                  if (typeof cb === 'function') cb({ ok: true });
                } else {
                  console.log('DM join denied - not friends', aId, bId);
                  if (typeof cb === 'function') cb({ ok: false, reason: 'not_friends' });
                }
              } else {
                console.log('DM join denied - user not part of DM', user, room);
                if (typeof cb === 'function') cb({ ok: false, reason: 'not_part' });
              }
            } else {
              console.log('Invalid DM room format', room);
              if (typeof cb === 'function') cb({ ok: false, reason: 'invalid_room' });
            }
          } else {
            socket.join(room);
            console.log(`User ${user} joined room ${room} (no auth check)`);
            if (typeof cb === 'function') cb({ ok: true });
          }
        }
      } catch (error) {
        console.log('Error at joining room', error);
        if (typeof cb === 'function') cb({ ok: false, reason: 'error' });
      }
    });

    socket.on('sendMessage', async (room, message, user) => {
      try {
        let userIdentifier = user;
        if (user && typeof user === 'object') {
          userIdentifier = user.userid || user.email || user.username || user.id || JSON.stringify(user);
        }
        const userId = await resolveUserIdentifier(userIdentifier);
        const userDoc = await User.findOne({ userid: userId }, { name: 1, username: 1 });
        const displayName = userDoc ? (userDoc.username || userDoc.name) : (typeof user === 'string' ? user : (user && user.name) || (user && user.username) || String(user));
        const mes = new Message({ userId: userId, user: displayName, message: message, room: room, senderId: userId });
        const newmes = await mes.save();
        console.log('Saved message', newmes.messageId || newmes._id);
        // emit to entire room including sender so clients receive canonical message with messageId
        io.to(room).emit('message', newmes);
      } catch (error) {
        console.log('Error at sendMessage', error);
      }
    });

    // delivered acknowledgement from client
    socket.on('messageReceived', async (room, messageId, userId) => {
      try {
        if (!messageId) return;
        const updated = await Message.findOneAndUpdate({ messageId }, { $set: { deliveredAt: new Date() } }, { new: true });
        if (updated) {
          io.to(room).emit('messageStatus', { messageId: updated.messageId, deliveredAt: updated.deliveredAt, readAt: updated.readAt });
        }
      } catch (err) {
        console.log('Error updating deliveredAt', err);
      }
    });

    // read acknowledgement from client
    socket.on('messageRead', async (room, messageId, userId) => {
      try {
        if (!messageId) return;
        const updated = await Message.findOneAndUpdate({ messageId }, { $set: { readAt: new Date() } }, { new: true });
        if (updated) {
          io.to(room).emit('messageStatus', { messageId: updated.messageId, deliveredAt: updated.deliveredAt, readAt: updated.readAt });
        }
      } catch (err) {
        console.log('Error updating readAt', err);
      }
    });

    // typing indicator
    socket.on('typing', (room, userDisplay) => {
      try {
        socket.broadcast.to(room).emit('typing', { user: userDisplay });
      } catch (err) {
        console.log('Error broadcasting typing', err);
      }
    });

    // WebRTC signaling: offers, answers, ICE candidates and hangup
    // Only relay if the socket has joined the target room (joinRoom enforces friend checks for DM rooms)
    socket.on('webrtc-offer', (room, offer, from) => {
      try {
        if (socket.rooms && socket.rooms.has(room)) {
          socket.to(room).emit('webrtc-offer', offer, from);
        } else {
          console.log('webrtc-offer denied - socket not in room', room, from);
        }
      } catch (err) {
        console.log('Error relaying webrtc-offer', err);
      }
    });

    socket.on('webrtc-answer', (room, answer, from) => {
      try {
        if (socket.rooms && socket.rooms.has(room)) {
          socket.to(room).emit('webrtc-answer', answer, from);
        } else {
          console.log('webrtc-answer denied - socket not in room', room, from);
        }
      } catch (err) {
        console.log('Error relaying webrtc-answer', err);
      }
    });

    socket.on('webrtc-ice', (room, candidate, from) => {
      try {
        if (socket.rooms && socket.rooms.has(room)) {
          socket.to(room).emit('webrtc-ice', candidate, from);
        } else {
          console.log('webrtc-ice denied - socket not in room', room, from);
        }
      } catch (err) {
        console.log('Error relaying webrtc-ice', err);
      }
    });

    socket.on('webrtc-hangup', (room, from) => {
      try {
        // Store missed call event (if not attended or rejected)
        // This is a simple version; you may want to check if an attended/rejected call already exists for this room/recently
        try {
          const callMsg = new Message({
            userId: from,
            user: from,
            room: room,
            type: 'call',
            callStatus: 'missed',
          });
          callMsg.save();
        } catch (err) {
          console.log('Error saving missed call message', err);
        }
        if (socket.rooms && socket.rooms.has(room)) {
          socket.to(room).emit('webrtc-hangup', from);
        } else {
          console.log('webrtc-hangup denied - socket not in room', room, from);
        }
      } catch (err) {
        console.log('Error relaying webrtc-hangup', err);
      }
    });

    // invite / accept / decline flow for explicit incoming-call UI
    socket.on('webrtc-invite', async (room, payload, from) => {
      try {
        const socketsInRoom = await io.in(room).allSockets();
        console.log('webrtc-invite received', { from, room, payload, roomCount: socketsInRoom.size });
        if (socket.rooms && socket.rooms.has(room)) {
          socket.to(room).emit('webrtc-invite', payload, from);
          console.log('webrtc-invite relayed to room', room);
        } else {
          console.log('webrtc-invite denied - socket not in room', room, from);
        }
      } catch (err) {
        console.log('Error relaying webrtc-invite', err);
      }
    });

    socket.on('webrtc-accept', async (room, payload, from) => {
      try {
        const socketsInRoom = await io.in(room).allSockets();
        console.log('webrtc-accept received', { from, room, payload, roomCount: socketsInRoom.size });
        // Store attended call event
        try {
          const callMsg = new Message({
            userId: from,
            user: from,
            room: room,
            type: 'call',
            callStatus: 'attended',
          });
          await callMsg.save();
        } catch (err) {
          console.log('Error saving attended call message', err);
        }
        if (socket.rooms && socket.rooms.has(room)) {
          socket.to(room).emit('webrtc-accept', payload, from);
          console.log('webrtc-accept relayed to room', room);
        } else {
          console.log('webrtc-accept denied - socket not in room', room, from);
        }
      } catch (err) {
        console.log('Error relaying webrtc-accept', err);
      }
    });

    socket.on('webrtc-decline', async (room, payload, from) => {
      try {
        const socketsInRoom = await io.in(room).allSockets();
        console.log('webrtc-decline received', { from, room, payload, roomCount: socketsInRoom.size });
        // Store rejected call event
        try {
          const callMsg = new Message({
            userId: from,
            user: from,
            room: room,
            type: 'call',
            callStatus: 'rejected',
          });
          await callMsg.save();
        } catch (err) {
          console.log('Error saving rejected call message', err);
        }
        if (socket.rooms && socket.rooms.has(room)) {
          socket.to(room).emit('webrtc-decline', payload, from);
          console.log('webrtc-decline relayed to room', room);
        } else {
          console.log('webrtc-decline denied - socket not in room', room, from);
        }
      } catch (err) {
        console.log('Error relaying webrtc-decline', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
};
