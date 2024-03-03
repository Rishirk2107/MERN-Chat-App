const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser=require("body-parser");
var session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname+"/front-end"))

var users=new Array();
users=[
    {name:"RIshi",email:"rishi@gmail.com",password:"1234"},
    {name:"kumar",email:"kumar@gmail.com",password:"1234"},
]
var groups=new Array();
var admin={email:"rishi@gmail.com",password:"12345"}

// Serve HTML file
app.get('/', (req, res) => {
    console.log(req.session.email)
  res.sendFile(__dirname + '/index.html');
});

app.get('/user/signup', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/signup.html');
  });

  app.get('/user/login', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/login.html');
  });

  app.get('/admin/signup', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/login-admin.html');
  });

  app.get('/route', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/route.html');
  });

  app.get('/group', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/creategrp.html');
  });
  app.post("/user/signup",(req,res)=>{
    console.log(req.body)
    const {name,email,password}=req.body;
    users.push({name:name,email:email,password:password});
    console.log(users);
    res.redirect("/user/login")
  })

  app.post("/user/login",(req,res)=>{
    const {email,password}=req.body;
    for(let i=0;i<users.length;i++){
        if (email==(users[i]["email"])){
            req.session.email=email;
            res.redirect("/")
        }
    }
  })


  app.post("/admin/login",(req,res)=>{
    const {email,password}=req.body;
    if(email==admin["email"]){
        res.redirect("/group")
    }
  })

  app.post("/addUsers",(req,res)=>{
    res.json({"users":users})
  })

  app.post("/submitUsers",(req,res)=>{
    console.log(req.body);
  })


// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected',socket.id);


  socket.on('setUser', (user) => {
    socket.user = user;
    userIds[user] = socket.id; // Map username to socket.id
    console.log(`Username set for socket: ${user}`);
  });


  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on('sendMessage', (room, message) => {
    io.to(room).emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
