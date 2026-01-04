const { User } = require('../../model/dbmodel');

async function resolveUserIdentifier(identifier) {
  if (identifier == null) return null;

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
  const { User: _ } = require('../../model/dbmodel');
  return await _.findOne({ userid: uid });
}

module.exports = { resolveUserIdentifier, getUserByIdentifier };
