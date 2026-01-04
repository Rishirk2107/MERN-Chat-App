const { Room, User, Message } = require('../../model/dbmodel');
const { resolveUserIdentifier } = require('../../libs/helpers/helpers');

async function adminGroups(req, res) {
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
}

async function addMember(req, res) {
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
}

async function removeMembers(req, res) {
  try {
    const { userIds, groupId, email, userid } = req.body;
    const adminId = req.userid || userid || await resolveUserIdentifier(email);
    const room = await Room.findOne({ roomid: groupId });
    if (!room) return res.status(404).json({ Message: 'Room not found' });
    if (room.admin !== adminId) return res.status(403).json({ Message: 'Not authorized' });
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
}

async function deleteGroups(req, res) {
  try {
    console.log(req.body.selectedRooms);
    for (const element of req.body.selectedRooms) {
      await Room.deleteOne({ roomid: element });
      console.log(element);
      await Message.deleteMany({ room: element });
    }
    res.json({ Message: true });
  } catch (error) {
    console.log('Error at deleting rooms', error);
    res.status(500).json({ Message: false, error: 'Server error' });
  }
}

async function add(req, res) {
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
}

async function remove(req, res) {
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
}

module.exports = { adminGroups, addMember, removeMembers, deleteGroups, add, remove };
