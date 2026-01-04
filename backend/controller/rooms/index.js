const { Room, Message, User } = require('../../model/dbmodel');
const { generateRandomString } = require('../../libs/helpers/generator');
const { resolveUserIdentifier } = require('../../libs/helpers/helpers');

async function createRoom(req, res) {
  try {
    const { name, selectedEmails } = req.body;
    const adminId = req.userid || await resolveUserIdentifier(req.body.email);
    if (!adminId) return res.status(400).json({ Message: 'Admin identifier required' });
    const roomid = generateRandomString();
    const userIds = [];
    const provided = (selectedEmails || []).filter(ident => ident != null && String(ident).trim() !== '');
    const unresolved = [];
    for (const ident of provided) {
      const uid = await resolveUserIdentifier(ident);
      if (uid != null) userIds.push(uid);
      else unresolved.push(ident);
    }
    if (unresolved.length) console.log('Unresolved selectedEmails (ignored):', unresolved);
    if (!userIds.includes(adminId)) userIds.push(adminId);

    const newRoom = new Room({ name: name, roomid: roomid, users: userIds, admin: adminId });
    const savedRoom = await newRoom.save();
    console.log('Created room:', savedRoom);

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
}

async function getUserRooms(req, res) {
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
}

async function sendData(req, res) {
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
}

module.exports = { createRoom, getUserRooms, sendData };
