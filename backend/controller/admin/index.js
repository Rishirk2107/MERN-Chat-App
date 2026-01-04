const { Room, User } = require('../../model/dbmodel');
const { resolveUserIdentifier } = require('../../libs/helpers/helpers');

// Basic admin credentials (kept simple as before)
const admin = { email: 'rishi@gmail.com', password: '12345' };

function login(req, res) {
  const { username, password } = req.body;
  if (username === admin.email && password === admin.password) {
    res.json({ Message: true, name: 'Admin' });
  } else {
    res.json({ Message: false });
  }
}

async function getRooms(req, res) {
  try {
    const { email, userid } = req.body;
    const userId = req.userid || userid || await resolveUserIdentifier(email);
    if (!userId) return res.status(400).json({ Message: false, error: 'User not found' });
    const rooms = await Room.find({ $or: [{ admin: userId }, { users: userId }] }, { _id: 0, roomid: 1, name: 1, admin: 1 });
    console.log(rooms);
    res.json({ rooms: rooms });
  } catch (error) {
    console.log('Error at getting group list at adduser', error);
    res.status(500).json({ Message: false });
  }
}

async function getAvailableUsers(req, res) {
  try {
    console.log(req.body, 'Hello');
    const roomid = req.body.roomId;
    const remusers = await User.find({ rooms: { $ne: roomid } }, { _id: 0, userid: 1, username: 1, name: 1 });
    console.log(remusers, '@');
    res.json({ users: remusers });
  } catch (error) {
    console.log('Error at admin.addUsers', error);
    res.status(500).json({ Message: false });
  }
}

async function getRoomsUsers(req, res) {
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
}

module.exports = { login, getRooms, getAvailableUsers, getRoomsUsers };
