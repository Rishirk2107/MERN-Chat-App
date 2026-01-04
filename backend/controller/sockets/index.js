const { Room, User, Message, Friend } = require('../../model/dbmodel');
const { resolveUserIdentifier } = require('../../libs/helpers/helpers');

module.exports = function initSockets(io) {
  io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('joinRoom', async (room, user) => {
      try {
        const result = await Room.findOne({ roomid: room });
        let userIdentifier = user;
        if (user && typeof user === 'object') {
          userIdentifier = user.userid || user.email || user.username || user.id || JSON.stringify(user);
        }
        const userId = await resolveUserIdentifier(userIdentifier);
        if (result) {
          if (userId != null && (result.admin === userId || result.users.includes(userId))) {
            socket.join(room);
            console.log(`User ${userId} joined room ${room}`);
          } else {
            console.log('Unauthorised Access for', user, 'in room', room);
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
                } else {
                  console.log('DM join denied - not friends', aId, bId);
                }
              } else {
                console.log('DM join denied - user not part of DM', user, room);
              }
            } else {
              console.log('Invalid DM room format', room);
            }
          } else {
            socket.join(room);
            console.log(`User ${user} joined room ${room} (no auth check)`);
          }
        }
      } catch (error) {
        console.log('Error at joining room', error);
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
        const mes = new Message({ userId: userId, user: displayName, message: message, room: room });
        const newmes = await mes.save();
        console.log(newmes);
        socket.broadcast.to(room).emit('message', message, displayName);
      } catch (error) {
        console.log('Error at sendMessage', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
};
