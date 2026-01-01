const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { User, Room, Message, Anonymousrooms, Anonymouschat, Friend } = require('./model/dbmodel');
const { generateRandomString } = require('./controller/generator');

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

// Basic admin (consider moving to env vars for production)
var admin = { email: 'rishi@gmail.com', password: '12345' };

// Routes
app.get('/group/room/:roomId', (req, res) => {
  console.log(req.params.roomId);
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'index.html'));
});

app.get('/group/route', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'grouproute.html'));
});

app.get('/user/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'signup.html'));
});

app.get('/user/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'login.html'));
});

app.get('/admin/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'login-admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'route.html'));
});

app.get('/group/create', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'creategrp.html'));
});

app.get('/group/list', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'rooms.html'));
});

app.get('/group/delete', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'deletegrp.html'));
});

app.get('/group/adduser', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'adduser', 'adduser.html'));
});

app.get('/group/removeuser', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'removeusers.html'));
});

// Anonymous pages
app.get('/anonymous/', async (req, res) => {
  // This route performs a redirect/landing
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'anonymousredirect.html'));
});

app.get('/anonymous/create', async (req, res) => {
  // Shows the create anonymous discussion page
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'anonymouscreate.html'));
});

app.get('/anonymous/create-discussion', async (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'anonymouscreate.html'));
});

app.get('/anonymous/discussion/:discussionid', async (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'templates', 'discussion.html'));
});

// API endpoints
app.post('/user/signup', async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password, socketid } = req.body;
    const newUser = new User({ name: name, email: email, password: password, socketid: socketid });
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
      res.json({ Message: true, name: user.name });
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

app.post('/addUsers', async (req, res) => {
  try {
    const users = await User.find({}, { _id: 0, email: 1, name: 1 });
    console.log(users);
    res.json({ users: users });
  } catch (error) {
    console.log('Error at addUsers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/submitUsers', async (req, res) => {
  try {
    const { name, selectedEmails, email } = req.body;
    if (!email) return res.status(400).json({ Message: 'Email required' });
    const users = selectedEmails;
    const admin = email;
    const roomid = generateRandomString();
    const newRoom = new Room({ name: name, roomid: roomid, users: users, admin: admin });
    const savedRoom = await newRoom.save();
    console.log(savedRoom);
    for (const user of savedRoom.users) {
      const updatedUser = await User.findOneAndUpdate({ email: user }, { $push: { rooms: roomid } });
      console.log(updatedUser);
    }
    console.log(savedRoom.users);
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at creating Room', error);
    res.status(500).json({ Message: false, error: 'Server error' });
  }
});

app.post('/getRooms', async (req, res) => {
  try {
    const { email } = req.body;
    const user = email;
    const rooms = await User.aggregate([
      { $match: { email: user } },
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

app.post('/senddata', async (req, res) => {
  try {
    const { email } = req.body;
    const user = email;
    console.log(req.body.roomid);
    const messages = await Message.find({ room: req.body.roomid }, { _id: 0, message: 1, user: 1 }).sort({ createdAt: 1 });
    const username = await User.findOne({ email: user }, { _id: 0, name: 1 });
    console.log(username);
    res.json({ user: user, messages: messages });
  } catch (error) {
    console.log('Error at senddata', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/group/showgroups', async (req, res) => {
  try {
    const { email } = req.body;
    const rooms = await Room.find({ admin: email }, { _id: 0, __v: 0, users: 0 });
    res.json({ rooms: rooms });
  } catch (error) {
    console.log('Error at showgroups', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/add-user', async (req, res) => {
  try {
    const { username, groupId, email } = req.body;
    const room = await Room.findOne({ roomid: groupId });
    if (!room) return res.status(404).json({ Message: 'Room not found' });
    if (room.admin !== email) return res.status(403).json({ Message: 'Not authorized' });
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ Message: 'User not found' });
    if (room.users.includes(user.email)) return res.json({ Message: 'User already in group' });
    room.users.push(user.email);
    await room.save();
    await User.findOneAndUpdate({ email: user.email }, { $push: { rooms: groupId } });
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at add-user', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/remove-users', async (req, res) => {
  try {
    const { userIds, groupId, email } = req.body;
    const room = await Room.findOne({ roomid: groupId });
    if (!room) return res.status(404).json({ Message: 'Room not found' });
    if (room.admin !== email) return res.status(403).json({ Message: 'Not authorized' });
    room.users = room.users.filter(u => !userIds.includes(u));
    await room.save();
    for (const uid of userIds) {
      await User.findOneAndUpdate({ email: uid }, { $pull: { rooms: groupId } });
    }
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at remove-users', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/group/delete', async (req, res) => {
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

app.post('/admin/getrooms', async (req, res) => {
  try {
    const { email } = req.body;
    // return rooms where user is admin or a member, and include admin field
    const rooms = await Room.find({ $or: [{ admin: email }, { users: email }] }, { _id: 0, roomid: 1, name: 1, admin: 1 });
    console.log(rooms);
    res.json({ rooms: rooms });
  } catch (error) {
    console.log('Error at getting group list at adduser', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/admin/addUsers', async (req, res) => {
  try {
    console.log(req.body, 'Hello');
    const roomid = req.body.roomId;
    const remusers = await User.aggregate([
      { $lookup: { from: 'rooms', localField: 'email', foreignField: 'users', as: 'userRooms' } },
      { $match: { 'userRooms.roomid': { $ne: roomid } } },
      { $project: { _id: 0, email: 1, name: 1 } }
    ]);
    console.log(remusers, '@');
    res.json({ users: remusers });
  } catch (error) {
    console.log('Error at admin.addUsers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/group/addusers', async (req, res) => {
  try {
    console.log(req.body);
    const { selectedEmails, roomId } = req.body;
    for (let i = 0; i < selectedEmails.length; i++) {
      const email = selectedEmails[i];
      const room = await Room.findOne({ roomid: roomId });
      if (room && !room.users.includes(email)) {
        await Room.updateOne({ roomid: roomId }, { $push: { users: email } });
      }
    }
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at group.addusers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/admin/remUsers', async (req, res) => {
  try {
    console.log(req.body);
    const roomid = req.body.roomId;
    const result = await Room.aggregate([
      { $match: { roomid: roomid } },
      { $addFields: { users: { $filter: { input: '$users', as: 'user', cond: { $ne: ['$$user', '$admin'] } } } } },
      { $unwind: '$users' },
      { $lookup: { from: 'users', localField: 'users', foreignField: 'email', as: 'userData' } },
      { $unwind: '$userData' },
      { $project: { _id: 0, name: '$userData.name', email: '$userData.email' } }
    ]);

    console.log(result);
    res.json({ Users: result });
  } catch (error) {
    console.log('Error at admin.remUsers', error);
    res.status(500).json({ Message: false });
  }
});

app.post('/group/removeusers', async (req, res) => {
  try {
    console.log(req.body);
    const { selectedEmails, roomId } = req.body;
    for (let i = 0; i < selectedEmails.length; i++) {
      const result = await Room.updateOne({ roomid: roomId }, { $pull: { users: selectedEmails[i] } });
      console.log(result);
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
    const { email } = req.body;
    if (email) {
      const discussion = new Anonymousrooms({ topic: req.body.topic, topicId: generateRandomString(), createdBy: email });
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
    const { name, email } = req.body;
    if (!name) return res.status(400).json({ Message: false, error: 'Name required' });
    const regex = new RegExp(name, 'i');
    const users = await User.find({ name: regex, email: { $ne: email } }, { _id: 1, name: 1, email: 1 });
    res.json({ users });
  } catch (error) {
    console.log('Error at friends.search', error);
    res.status(500).json({ Message: false });
  }
});

// Send friend request
app.post('/friends/request', async (req, res) => {
  try {
    const { email, targetEmail } = req.body; // email = requester
    if (!email || !targetEmail) return res.status(400).json({ Message: false, error: 'Missing params' });

    // prevent self-request
    if (email === targetEmail) return res.status(400).json({ Message: false, error: 'Cannot friend yourself' });

    // check existing relation
    const existing = await Friend.findOne({ $or: [
      { requester: email, recipient: targetEmail },
      { requester: targetEmail, recipient: email }
    ]});
    if (existing) return res.json({ Message: false, error: 'Request already exists or you are already friends' });

    const fr = new Friend({ requester: email, recipient: targetEmail, status: 'pending' });
    await fr.save();
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at friends.request', error);
    res.status(500).json({ Message: false });
  }
});

// Get incoming friend requests
app.post('/friends/incoming', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ Message: false });
    const requests = await Friend.find({ recipient: email, status: 'pending' }, { _id: 1, requester: 1, createdAt: 1 });
    res.json({ requests });
  } catch (error) {
    console.log('Error at friends.incoming', error);
    res.status(500).json({ Message: false });
  }
});

// Accept friend request
app.post('/friends/accept', async (req, res) => {
  try {
    const { email, requester } = req.body; // email is recipient
    if (!email || !requester) return res.status(400).json({ Message: false });
    const updated = await Friend.findOneAndUpdate({ requester: requester, recipient: email, status: 'pending' }, { status: 'accepted' }, { new: true });
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
    const { email } = req.body;
    if (!email) return res.status(400).json({ Message: false });
    const friends = await Friend.find({ $or: [ { requester: email }, { recipient: email } ], status: 'accepted' });
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
      if (result) {
        if (result.admin === user || result.users.includes(user)) {
          socket.join(room);
          console.log(`User ${user} joined room ${room}`);
        } else {
          console.log('Unauthorised Access for', user, 'in room', room);
        }
      } else {
        // For direct messages (dm:emailA|emailB) ensure friendship
        if (room.startsWith('dm:')) {
          const parts = room.replace('dm:', '').split('|');
          if (parts.length === 2) {
            const [a, b] = parts;
            // allow if user matches one of the participants and they are friends
            if (user === a || user === b) {
              const friend = await Friend.findOne({
                $or: [
                  { requester: a, recipient: b },
                  { requester: b, recipient: a }
                ],
                status: 'accepted'
              });
              if (friend) {
                socket.join(room);
                console.log(`User ${user} joined DM room ${room}`);
              } else {
                console.log('DM join denied - not friends', a, b);
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
      const username = await User.findOne({ email: user }, { name: 1 });
      const mes = new Message({ user: username.name, message: message, room: room });
      const newmes = await mes.save();
      console.log(newmes);
      socket.broadcast.to(room).emit('message', message, username.name);
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
