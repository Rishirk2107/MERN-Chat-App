const jwt = require('jsonwebtoken');
const { User } = require('../../model/dbmodel');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Express middleware: verify Bearer token, attach `req.user` and `req.userid`
async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || '';
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ Message: false, error: 'Missing token' });
    const token = auth.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ Message: false, error: 'Invalid token' });
    }

    // Attach basic user info if possible
    if (decoded && (decoded.userid || decoded.user)) {
      const uid = decoded.userid || decoded.user.userid || decoded.userId;
      if (uid != null) {
        req.userid = uid;
        // optionally fetch full user doc
        try {
          const user = await User.findOne({ userid: uid }, { _id: 0, password: 0 });
          if (user) req.user = user;
        } catch (e) {
          // non-fatal
        }
      }
    }

    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error', error);
    res.status(500).json({ Message: false, error: 'Auth error' });
  }
}

module.exports = { authenticate, generateToken };
