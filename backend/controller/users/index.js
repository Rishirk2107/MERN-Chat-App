const { User } = require('../../model/dbmodel');
const { generateToken } = require('../../libs/auth/authenticate');

async function signup(req, res) {
  try {
    console.log(req.body);
    const { name, username, email, password, socketid, mobileNumber, dob, gender, state, country, bio } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ Message: false, error: 'Missing required fields' });
    const existing = await User.findOne({ $or: [{ email: email }, { username: username }] });
    if (existing) return res.status(400).json({ Message: false, error: 'Email or username already exists' });
    const newUser = new User({
      name: name,
      username: username,
      email: email,
      password: password,
      socketid: socketid,
      mobileNumber: mobileNumber || null,
      dob: dob ? new Date(dob) : null,
      gender: gender || null,
      state: state || null,
      country: country || null,
      bio: bio || null
    });
    const savedUser = await newUser.save();
    console.log(savedUser);
    res.json({ Message: 1 });
  } catch (error) {
    console.log('Error at Signup', error);
    res.status(500).json({ Message: false, error: 'Server error' });
  }
}

async function login(req, res) {
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
}

async function list(req, res) {
  try {
    const users = await User.find({}, { _id: 0, userid: 1, username: 1, name: 1 });
    console.log(users);
    res.json({ users: users });
  } catch (error) {
    console.log('Error at addUsers', error);
    res.status(500).json({ Message: false });
  }
}

module.exports = { signup, login, list };
