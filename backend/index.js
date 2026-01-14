const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { authenticate} = require('./libs/auth/authenticate');

dotenv.config();

const app = express();

// CORS FIRST
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chat.rishinex.tech",
      "https://rishinex.tech",
      "https://www.rishinex.tech"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat.rishinex.tech",
      "https://rishinex.tech"
    ],
    methods: ["GET", "POST"]
  }
});

// Import modular controllers
const usersController = require('./controller/users');
const roomsController = require('./controller/rooms');
const groupsController = require('./controller/groups');
const adminController = require('./controller/admin');
const anonymousController = require('./controller/anonymous');
const friendsController = require('./controller/friends');
const initSockets = require('./controller/sockets');
const initFiles = require('./controller/files');
// Health check endpoint
const healthRouter = require('./controller/health');

// Wire routes to controllers
app.post('/user/signup', usersController.signup);
app.post('/user/login', usersController.login);
app.post('/users/list', usersController.list);

app.post('/admin/login', adminController.login);

app.post('/rooms/create', authenticate, roomsController.createRoom);
app.post('/rooms/user', authenticate, roomsController.getUserRooms);
app.post('/senddata', authenticate, roomsController.sendData);

app.post('/groups/admin', authenticate, groupsController.adminGroups);
app.post('/groups/add-member', authenticate, groupsController.addMember);
app.post('/groups/remove-members', authenticate, groupsController.removeMembers);
app.post('/groups/delete', authenticate, groupsController.deleteGroups);
app.post('/groups/add', authenticate, groupsController.add);
app.post('/groups/remove', authenticate, groupsController.remove);

app.post('/admin/rooms', authenticate, adminController.getRooms);
app.post('/admin/users/available', authenticate, adminController.getAvailableUsers);
app.post('/admin/rooms/users', authenticate, adminController.getRoomsUsers);

app.post('/create/discussion', anonymousController.createDiscussion);
app.post('/discussion/display/topic', anonymousController.getTopic);

app.post('/friends/search', friendsController.search);
app.post('/friends/request', authenticate, friendsController.request);
app.post('/friends/incoming', authenticate, friendsController.incoming);
app.post('/friends/accept', authenticate, friendsController.accept);
app.post('/friends/list', friendsController.list);

// Initialize socket handlers
initSockets(io);

// Initialize file upload routes (needs access to io)
initFiles(app, io);
app.use('/', healthRouter);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
