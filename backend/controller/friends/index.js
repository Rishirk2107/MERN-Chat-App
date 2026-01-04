const { User, Friend } = require('../../model/dbmodel');
const { resolveUserIdentifier } = require('../../libs/helpers/helpers');

async function search(req, res) {
  try {
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
}

async function request(req, res) {
  try {
    const { email, targetEmail, userid, targetId } = req.body;
    const requesterId = req.userid || userid || await resolveUserIdentifier(email);
    const recipientId = targetId || await resolveUserIdentifier(targetEmail);
    if (!requesterId || !recipientId) return res.status(400).json({ Message: false, error: 'Missing params' });
    if (requesterId === recipientId) return res.status(400).json({ Message: false, error: 'Cannot friend yourself' });
    const existing = await Friend.findOne({ $or: [
      { 'requester.userid': requesterId, 'recipient.userid': recipientId },
      { 'requester.userid': recipientId, 'recipient.userid': requesterId }
    ]});
    if (existing) return res.json({ Message: false, error: 'Request already exists or you are already friends' });
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
}

async function incoming(req, res) {
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
}

async function accept(req, res) {
  try {
    const { email, requester, userid, requesterId } = req.body;
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
}

async function list(req, res) {
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
}

module.exports = { search, request, incoming, accept, list };
