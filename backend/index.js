const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { User, Room, Message, Anonymousrooms, Anonymouschat, Friend } = require('./model/dbmodel');
const { generateRandomString } = require('./controller/generator');
const { authenticate, generateToken } = require('./libs/auth/authenticate');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Serve static frontend (located in parent folder)
app.use(express.static(path.join(__dirname, '..', 'front-end')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();

// Helper: resolve an identifier (userid number, numeric string, email, username, or user object) to numeric userid
async function resolveUserIdentifier(identifier) {
  if (identifier == null) return null;

  // If an object was passed (e.g. a user document from /addUsers), use its fields
  if (typeof identifier === 'object') {
    if (typeof identifier.userid === 'number') return identifier.userid;
    if (typeof identifier.userid === 'string' && /^\d+$/.test(identifier.userid)) return parseInt(identifier.userid, 10);
    if (identifier.email) {
      const u = await User.findOne({ email: String(identifier.email) });
      return u ? u.userid : null;
    }
    if (identifier.username) {
      const u = await User.findOne({ username: String(identifier.username) });
      return u ? u.userid : null;
    }
    return null;
  }

  if (typeof identifier === 'number') return identifier;
  const asStr = String(identifier).trim();
  if (asStr === '') return null;
  if (/^\d+$/.test(asStr)) return parseInt(asStr, 10);
  if (asStr.includes('@')) {
    const u = await User.findOne({ email: asStr });
    return u ? u.userid : null;
  }
  const u = await User.findOne({ username: asStr });
  return u ? u.userid : null;
}

async function getUserByIdentifier(identifier) {
  const uid = await resolveUserIdentifier(identifier);
  if (uid == null) return null;
  return await User.findOne({ userid: uid });
}

// Basic admin (consider moving to env vars for production)
var admin = { email: 'rishi@gmail.com', password: '12345' };

// API endpoints
app.post('/user/signup', async (req, res) => {
  try {
    console.log(req.body);
    const { name, username, email, password, socketid } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ Message: false, error: 'Missing required fields' });
    const existing = await User.findOne({ $or: [{ email: email }, { username: username }] });
    if (existing) return res.status(400).json({ Message: false, error: 'Email or username already exists' });
    const newUser = new User({ name: name, username: username, email: email, password: password, socketid: socketid });
    const savedUser = await newUser.save();
    console.log(savedUser);
    res.json({ Message: 1 });
  } catch (error) {
    console.log('Error at Signup', error);
    res.status(500).json({ Message: false, error: 'Server error' });
  }
});

app.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email, password: password });
    if (user) {
        const token = generateToken({ userid: user.userid, username: user.username });
        res.json({ Message: true, name: user.name, userid: user.userid, username: user.username, email: user.email, token });
    } else {
      res.json({ Message: false });
    }
  } catch (error) {
    console.log('Error at User Login',error);
    res.status(500).json({ Message: false, error: 'Server error' });
  }
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === admin.email && password === admin.password) {
    res.json({ Message: true, name: 'Admin' });
  } else {
    res.json({ Message: false });
  }
});

app.post('/users/list', async (req, res) => {
  try {
    const users = await User.find({}, { _id: 0, userid: 1, username: 1, name: 1 });
    console.log(users);
    res.json({ users: users });
  } catch (error) {
    console.log('Error at addUsers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/rooms/create', authenticate, async (req, res) => {
  try {
    const { name, selectedEmails } = req.body;
    const adminId = req.userid || await resolveUserIdentifier(req.body.email);
    if (!adminId) return res.status(400).json({ Message: 'Admin identifier required' });
    const roomid = generateRandomString();
    // resolve selected identifiers (emails/usernames/userids) to numeric userids
    const userIds = [];
    const provided = (selectedEmails || []).filter(ident => ident != null && String(ident).trim() !== '');
    const unresolved = [];
    for (const ident of provided) {
      const uid = await resolveUserIdentifier(ident);
      if (uid != null) userIds.push(uid);
      else unresolved.push(ident);
    }
    if (unresolved.length) console.log('Unresolved selectedEmails (ignored):', unresolved);
    // Ensure admin is part of the room users
    if (!userIds.includes(adminId)) userIds.push(adminId);

    const newRoom = new Room({ name: name, roomid: roomid, users: userIds, admin: adminId });
    const savedRoom = await newRoom.save();
    console.log('Created room:', savedRoom);

    // Update each user's rooms list (ensure no duplicates)
    const uniqueUsers = Array.from(new Set(savedRoom.users));
    for (const uid of uniqueUsers) {
      await User.findOneAndUpdate({ userid: uid }, { $addToSet: { rooms: roomid } });
    }

    console.log('Room users updated for:', uniqueUsers);
    res.json({ Message: true, roomid: roomid, resolvedUserIds: uniqueUsers });
  } catch (error) {
    console.log('Error at creating Room', error);
    res.status(500).json({ Message: false, error: 'Server error' });
  }
});

app.post('/rooms/user', authenticate, async (req, res) => {
  try {
    const { email, userid } = req.body;
    const userId = req.userid || userid || await resolveUserIdentifier(email);
    if (!userId) return res.status(400).json({ Message: false, error: 'User not found' });
    const rooms = await User.aggregate([
      { $match: { userid: userId } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'rooms',
          foreignField: 'roomid',
          as: 'userRooms'
        }
      },
      { $project: { _id: 0, 'userRooms.name': 1, 'userRooms.roomid': 1 } }
    ]);
    console.log(rooms[0]);
    res.json(rooms[0] || {});
  } catch (error) {
    console.log('Error at getRooms', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/senddata', authenticate, async (req, res) => {
  try {
    const { email, userid } = req.body;
    const userId = req.userid || userid || await resolveUserIdentifier(email);
    console.log(req.body.roomid);
    const messages = await Message.find({ room: req.body.roomid }, { _id: 0, message: 1, user: 1, userId:1 }).sort({ createdAt: 1 });
    const userDoc = await User.findOne({ userid: userId }, { _id: 0, name: 1, username:1 });
    console.log(userDoc);
    res.json({ user: userDoc ? (userDoc.username || userDoc.name) : null, messages: messages });
  } catch (error) {
    console.log('Error at senddata', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/groups/admin', authenticate, async (req, res) => {
  try {
    const { email, userid } = req.body;
    const adminId = req.userid || userid || await resolveUserIdentifier(email);
    if (!adminId) return res.status(400).json({ Message: false, error: 'Admin not found' });
    const rooms = await Room.find({ admin: adminId }, { _id: 0, __v: 0, users: 0 });
    res.json({ rooms: rooms });
  } catch (error) {
    console.log('Error at showgroups', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/groups/add-member', authenticate, async (req, res) => {
  try {
    const { username, groupId } = req.body;
    const adminId = req.userid || await resolveUserIdentifier(req.body.email);
    const room = await Room.findOne({ roomid: groupId });
    if (!room) return res.status(404).json({ Message: 'Room not found' });
    if (room.admin !== adminId) return res.status(403).json({ Message: 'Not authorized' });
    const user = await User.findOne({ username: username });
    if (!user) return res.status(404).json({ Message: 'User not found' });
    if (room.users.includes(user.userid)) return res.json({ Message: 'User already in group' });
    room.users.push(user.userid);
    await room.save();
    await User.findOneAndUpdate({ userid: user.userid }, { $push: { rooms: groupId } });
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at add-user', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/groups/remove-members', authenticate, async (req, res) => {
  try {
    const { userIds, groupId, email, userid } = req.body;
    const adminId = req.userid || userid || await resolveUserIdentifier(email);
    const room = await Room.findOne({ roomid: groupId });
    if (!room) return res.status(404).json({ Message: 'Room not found' });
    if (room.admin !== adminId) return res.status(403).json({ Message: 'Not authorized' });
    // resolve incoming identifiers to numeric ids
    const idsToRemove = [];
    for (const ident of userIds || []) {
      const uid = await resolveUserIdentifier(ident);
      if (uid != null) idsToRemove.push(uid);
    }
    room.users = room.users.filter(u => !idsToRemove.includes(u));
    await room.save();
    for (const uid of idsToRemove) {
      await User.findOneAndUpdate({ userid: uid }, { $pull: { rooms: groupId } });
    }
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at remove-users', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/groups/delete', authenticate, async (req, res) => {
  try {
    console.log(req.body.selectedRooms);
    for (const element of req.body.selectedRooms) {
      await Room.deleteOne({ roomid: element });
      console.log(element);
      await Message.deleteMany({ room: element });
    }
    // respond after processing all deletions
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at deleting rooms', error);
    res.status(500).json({ Message: false, error: 'Server error' });
  }
});

app.post('/admin/rooms', authenticate, async (req, res) => {
  try {
    const { email, userid } = req.body;
    const userId = req.userid || userid || await resolveUserIdentifier(email);
    if (!userId) return res.status(400).json({ Message: false, error: 'User not found' });
    // return rooms where user is admin or a member, and include admin field
    const rooms = await Room.find({ $or: [{ admin: userId }, { users: userId }] }, { _id: 0, roomid: 1, name: 1, admin: 1 });
    console.log(rooms);
    res.json({ rooms: rooms });
  } catch (error) {
    console.log('Error at getting group list at adduser', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/admin/users/available', authenticate, async (req, res) => {
  try {
    console.log(req.body, 'Hello');
    const roomid = req.body.roomId;
    // return users who are not part of the room
    const remusers = await User.find({ rooms: { $ne: roomid } }, { _id: 0, userid: 1, username: 1, name: 1 });
    console.log(remusers, '@');
    res.json({ users: remusers });
  } catch (error) {
    console.log('Error at admin.addUsers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/groups/add', authenticate, async (req, res) => {
  try {
    console.log(req.body);
    const { selectedEmails, roomId } = req.body;
    for (let i = 0; i < (selectedEmails || []).length; i++) {
      const ident = selectedEmails[i];
      const uid = await resolveUserIdentifier(ident);
      const room = await Room.findOne({ roomid: roomId });
      if (room && uid != null && !room.users.includes(uid)) {
        await Room.updateOne({ roomid: roomId }, { $push: { users: uid } });
        await User.findOneAndUpdate({ userid: uid }, { $push: { rooms: roomId } });
      }
    }
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at group.addusers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/admin/rooms/users', authenticate, async (req, res) => {
  try {
    console.log(req.body);
    const roomid = req.body.roomId;
    const room = await Room.findOne({ roomid: roomid });
    if (!room) return res.json({ Users: [] });
    const users = room.users.filter(u => u !== room.admin);
    const result = await User.find({ userid: { $in: users } }, { _id: 0, name: 1, userid: 1, username: 1 });
    console.log(result);
    res.json({ Users: result });
  } catch (error) {
    console.log('Error at admin.remUsers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/groups/remove', authenticate, async (req, res) => {
  try {
    console.log(req.body);
    const { selectedEmails, roomId } = req.body;
    for (let i = 0; i < (selectedEmails || []).length; i++) {
      const ident = selectedEmails[i];
      const uid = await resolveUserIdentifier(ident);
      if (uid != null) {
        const result = await Room.updateOne({ roomid: roomId }, { $pull: { users: uid } });
        await User.findOneAndUpdate({ userid: uid }, { $pull: { rooms: roomId } });
        console.log(result);
      }
    }
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at deleting user', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/create/discussion', async (req, res) => {
  try {
    console.log(req.body);
    const { email, userid } = req.body;
    const creatorId = userid || await resolveUserIdentifier(email);
    if (creatorId) {
      const discussion = new Anonymousrooms({ topic: req.body.topic, topicId: generateRandomString(), createdBy: creatorId });
      const result = await discussion.save();
      console.log(result);
      if (discussion) {
        res.json({ Message: true, topicId: result.topicId });
      } else {
        res.json({ Message: false });
      }
    } else {
      res.json({ Message: false });
    }
  } catch (error) {
    console.log('Error at create discussion', error);
    res.status(500).json({ Message: false });
  }
});

// Friend system
// Search users by name (exclude requester)
app.post('/friends/search', async (req, res) => {
  try {
    // search by `username` primarily; fall back to `name` for compatibility
    const { username, name, email, userid } = req.body;
    const queryTerm = username || name;
    if (!queryTerm) return res.status(400).json({ Message: false, error: 'Username required' });
    const requesterId = userid || await resolveUserIdentifier(email);
    const regex = new RegExp(queryTerm, 'i');
    const users = await User.find({ $and: [ { $or: [ { username: regex }, { name: regex } ] }, { userid: { $ne: requesterId } } ] }, { _id: 0, userid: 1, username: 1, name: 1 });
    res.json({ users });
  } catch (error) {
    console.log('Error at friends.search', error);
    res.status(500).json({ Message: false });
  }
});

// Send friend request
app.post('/friends/request', authenticate, async (req, res) => {
  try {
    const { email, targetEmail, userid, targetId } = req.body; // email = requester
    const requesterId = req.userid || userid || await resolveUserIdentifier(email);
    const recipientId = targetId || await resolveUserIdentifier(targetEmail);
    if (!requesterId || !recipientId) return res.status(400).json({ Message: false, error: 'Missing params' });
    if (requesterId === recipientId) return res.status(400).json({ Message: false, error: 'Cannot friend yourself' });
    // check existing relationship either direction using nested userid fields
    const existing = await Friend.findOne({ $or: [
      { 'requester.userid': requesterId, 'recipient.userid': recipientId },
      { 'requester.userid': recipientId, 'recipient.userid': requesterId }
    ]});
    if (existing) return res.json({ Message: false, error: 'Request already exists or you are already friends' });
    // fetch user snapshots
    const requesterDoc = await User.findOne({ userid: requesterId }, { _id: 0, userid: 1, username: 1, name: 1, email: 1 });
    const recipientDoc = await User.findOne({ userid: recipientId }, { _id: 0, userid: 1, username: 1, name: 1, email: 1 });
    if (!requesterDoc || !recipientDoc) return res.status(400).json({ Message: false, error: 'User(s) not found' });
    const fr = new Friend({
      requester: { userid: requesterDoc.userid, username: requesterDoc.username, name: requesterDoc.name, email: requesterDoc.email },
      recipient: { userid: recipientDoc.userid, username: recipientDoc.username, name: recipientDoc.name, email: recipientDoc.email },
      status: 'pending'
    });
    await fr.save();
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at friends.request', error);
    res.status(500).json({ Message: false });
  }
});

// Get incoming friend requests
app.post('/friends/incoming', authenticate, async (req, res) => {
  try {
    const { email, userid } = req.body;
    const recipientId = req.userid || userid || await resolveUserIdentifier(email);
    if (!recipientId) return res.status(400).json({ Message: false });
    const requests = await Friend.find({ 'recipient.userid': recipientId, status: 'pending' }, { _id: 1, requester: 1, createdAt: 1 });
    res.json({ requests });
  } catch (error) {
    console.log('Error at friends.incoming', error);
    res.status(500).json({ Message: false });
  }
});

// Accept friend request
app.post('/friends/accept', authenticate, async (req, res) => {
  try {
    const { email, requester, userid, requesterId } = req.body; // email is recipient
    const recipientId = req.userid || userid || await resolveUserIdentifier(email);
    const reqId = requesterId || await resolveUserIdentifier(requester);
    if (!recipientId || !reqId) return res.status(400).json({ Message: false });
    const updated = await Friend.findOneAndUpdate({ 'requester.userid': reqId, 'recipient.userid': recipientId, status: 'pending' }, { status: 'accepted' }, { new: true });
    if (!updated) return res.status(404).json({ Message: false, error: 'Request not found' });
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at friends.accept', error);
    res.status(500).json({ Message: false });
  }
});

// List friends
app.post('/friends/list', async (req, res) => {
  try {
    const { email, userid } = req.body;
    const userId = req.userid || userid || await resolveUserIdentifier(email);
    if (!userId) return res.status(400).json({ Message: false });
    const friends = await Friend.find({ $or: [ { 'requester.userid': userId }, { 'recipient.userid': userId } ], status: 'accepted' });
    res.json({ friends });
  } catch (error) {
    console.log('Error at friends.list', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/discussion/display/topic', async (req, res) => {
  try {
    console.log(req.body);
    const topic = await Anonymousrooms.findOne({ topicId: req.body.topicId }, { _id: 0, topic: 1 });
    console.log(topic);
    res.json({ topic });
  } catch (error) {
    console.log('Error at discussion display', error);
    res.status(500).json({ Message: false });
  }
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  socket.on('joinRoom', async (room, user) => {
    try {
      const result = await Room.findOne({ roomid: room });
      // Accept `user` as a primitive identifier or an object snapshot
      let userIdentifier = user;
      if (user && typeof user === 'object') {
        userIdentifier = user.userid || user.email || user.username || user.id || JSON.stringify(user);
      }
      // resolve user identifier to numeric userid
      const userId = await resolveUserIdentifier(userIdentifier);
      if (result) {
        if (userId != null && (result.admin === userId || result.users.includes(userId))) {
          socket.join(room);
          console.log(`User ${userId} joined room ${room}`);
        } else {
          console.log('Unauthorised Access for', user, 'in room', room);
        }
      } else {
        // For direct messages (dm:identA|identB) ensure friendship
        if (room.startsWith('dm:')) {
          const parts = room.replace('dm:', '').split('|');
          if (parts.length === 2) {
            const [a, b] = parts;
            const aId = await resolveUserIdentifier(a);
            const bId = await resolveUserIdentifier(b);
            // allow if user matches one of the participants and they are friends
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
          // Allow joining for rooms not in DB (e.g., anonymous)
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
      // Accept `user` as a primitive identifier or an object snapshot
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
