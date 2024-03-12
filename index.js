const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser=require("body-parser");
var session = require('express-session');
const dotenv=require("dotenv");
const {User,Room,Message,Anonymouschat,Anonymousrooms}=require("./backend/model/dbmodel");
const {generateRandomString}=require("./backend/controller/generator")


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname+"/front-end"))
dotenv.config();


var admin={email:"rishi@gmail.com",password:"12345"}

// Serve HTML file
app.get('/group/room/:roomId', (req, res) => {
    console.log(req.session.email);
    console.log(req.params.roomId);
  res.sendFile(__dirname + '/front-end/templates/index.html');
});

app.get("/group/route",(req,res)=>{
  res.sendFile(__dirname+"/front-end/templates/grouproute.html");
})

app.get('/user/signup', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/signup.html');
  });

  app.get('/user/login', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/login.html');
  });

  app.get('/admin/signup', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/login-admin.html');
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/route.html');
  });

  app.get('/group/create', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/creategrp.html');
  });

  app.get('/group/list', (req, res) => {
    res.sendFile(__dirname + '/front-end/templates/rooms.html');
  });
  app.get("/group/delete",(req,res)=>{
    res.sendFile(__dirname + '/front-end/templates/deletegrp.html');
  })
  app.get("/group/adduser",(req,res)=>{``
    res.sendFile(__dirname + '/front-end/templates/adduser/adduser.html');
  });
  app.get("/group/removeuser",(req,res)=>{
    res.sendFile(__dirname + '/front-end/templates/removeusers.html');
  });

  app.get("/anonymous/",async(req,res)=>{
    res.sendFile(__dirname+"/front-end/templates/anonymousredirect.html")
  })

  app.get("/anonymous/",async(req,res)=>{
    res.sendFile(__dirname+"/front-end/templates/anonymouscreate.html")
  });

  app.get("/anonymous/create-discussion",async(req,res)=>{
    res.sendFile(__dirname+"/front-end/templates/anonymouscreate.html")
  })

  app.get("/anonymous/discussion/:discussionid",async(req,res)=>{
    res.sendFile(__dirname+"/front-end/templates/discussion.html");
  })


  app.post("/user/signup",async (req,res)=>{
    try{
    console.log(req.body)
    const {name,email,password,socketid}=req.body;
    const newUser=new User({name:name,email:email,password:password,socketid:socketid});
    const savedUser=await newUser.save();
    console.log(savedUser);
    res.json({"Message":1});
    }
    catch(error){
      console.log("Error at Signup",error);
    }
  })

  app.post("/user/login",async(req,res)=>{
    try{
    const {email,password}=req.body;
    const user=await User.findOne({email:email,password:password})
    if(user){
      req.session.email=email;
      res.redirect("/group/route");
    }
    else{
      res.json({"Message":"User not Registered"});
    }
    }
    catch(error){
      console.log("Error at User Login");
    }
  });


  app.post("/addUsers",async(req,res)=>{
    const users=await User.find({},{"_id":0,"email":1,"name":1})
    console.log(users)
    res.json({"users":users})
  })

  app.post("/submitUsers", async (req, res) => {
    try {
        const body = req.body;
        const users = body.selectedEmails;
        const name = body.groupName;
        const admin=req.session.email;
        const roomid = generateRandomString();
        const newRoom = new Room({ name: name, roomid: roomid, users: users, admin:admin });
        const savedRoom = await newRoom.save();
        console.log(savedRoom)

        for (const user of savedRoom.users) {
            const updatedUser = await User.findOneAndUpdate({ email: user }, { $push: { rooms: roomid } });
            console.log(updatedUser);
        }

        console.log(savedRoom.users);
        res.json({"Message":true});
    } catch (error) {
        console.log("Error at creating Room", error);
    }
});

app.post("/getRooms",async(req,res)=>{
  const user=req.session.email;
  //console.log(user)
  const rooms=await User.aggregate([
    {
      $match:{email:user}
    },
    {
      $lookup: {
          from: "rooms", 
          localField: "rooms", 
          foreignField: "roomid", 
          as: "userRooms"
      }
  },
  {
      $project: {
          _id: 0,
          "userRooms.name": 1, 
          "userRooms.roomid": 1 
      }
  }
  ])
  console.log(rooms[0]);
  res.json(rooms[0])
})


app.post("/senddata",async(req,res)=>{
  const user=req.session.email;
  console.log(req.body.roomid);
  const messages=await Message.find({"room":req.body.roomid},{_id:0,"message":1,user:1}).sort({createdAt:1});
  const username=await User.findOne({"email":user},{"_id":0,"name":1})
  console.log(username);
  res.json({user:user,messages:messages})
})


app.post("/group/showgroups",async(req,res)=>{
  const email=req.session.email;
  const rooms=await Room.find({admin:email},{_id:0,__v:0,users:0});
  res.json({rooms:rooms})
})

app.post("/group/delete",async(req,res)=>{
  try{
  console.log(req.body.selectedRooms);
  for (const element of req.body.selectedRooms) {
    await Room.deleteOne({ roomid: element });
    console.log(element);
    const deleted=await Message.deleteMany({room:element});
    //console.log(deleted)
  res.json({"Message":true});
  }
}
catch(error){
  console.log("Error at deleting rooms",error);
}
})

app.post("/admin/getrooms",async(req,res)=>{
  try{
    console.log(req.session.email)
  const rooms=await Room.find({admin:req.session.email},{"_id":0,"roomid":1,"name":1});
  console.log(rooms);
  res.json({rooms:rooms})
  }
  catch(error){
    console.log("Error at getting group list at adduser",error);
  }
})

app.post("/admin/addUsers",async(req,res)=>{
  console.log(req.body,"Hello");
  const roomid = req.body.roomId; 
const remusers = await User.aggregate([
  {
    $lookup: {
      from: "rooms",
      localField: "email",
      foreignField: "users",
      as: "userRooms"
    }
  },
  {
    $match: {
      "userRooms.roomid": { $ne: roomid }
    }
  },
  {
    $project: {
      _id: 0,
      email: 1,
      name: 1
    }
  }
]);

  console.log(remusers,"@");
  res.json({users:remusers})
  
})

app.post("/group/addusers",async(req,res)=>{
  console.log(req.body);
const {selectedEmails,roomId}=req.body;
for(let i=0;i<selectedEmails.length;i++){
  const email = selectedEmails[i];
    const room = await Room.findOne({ roomid: roomId });
    if (room && !room.users.includes(email)) {
        await Room.updateOne({ roomid: roomId }, { $push: { users: email } });
    }
}
res.json({"Message":true})
});

app.post("/admin/remUsers",async(req,res)=>{
  console.log(req.body);
  const roomid=req.body.roomId;
  const result=await Room.aggregate([
    { $match: { roomid: roomid } },
    { $addFields: { users: { $filter: { input: "$users", as: "user", cond: { $ne: ["$$user", "$admin"] } } } } },
    { $unwind: "$users" },
    { $lookup: { from: "users", localField: "users", foreignField: "email", as: "userData" } },
    { $unwind: "$userData" },
    { $project: { _id: 0, name: "$userData.name", email: "$userData.email" } }
  ])
  
  console.log(result);
  res.json({"Users":result})
  
})


app.post("/group/removeusers",async(req,res)=>{
  try{
  console.log(req.body);
  const {selectedEmails,roomId}=req.body;
  for(let i=0;i<selectedEmails.length;i++){
    const result=await Room.updateOne({roomid:roomId},{ $pull: { users: selectedEmails[i] } })
    console.log(result);
    
  };
  res.json({"Message":true})
}

catch(error){
  console.log("Error at deleting user",error);
}
})

app.post("/create/discussion",async(req,res)=>{
  console.log(req.body);
  if(req.session.email){
    const discussion=new Anonymousrooms({topic:req.body.topic,topicId:generateRandomString(),createdBy:req.session.email});
    const result=await discussion.save();
    console.log(result);
    if(discussion){
      res.json({Message:true,topicId:result.topicId});
    }
    else{
      res.json({Message:false})
    }
  }
  else{
  res.json({ Message: false });
  }
});

app.post("/discussion/display/topic",async(req,res)=>{
  console.log(req.body);
  const topic=await Anonymousrooms.findOne({topicId:req.body.topicId},{_id:0,topic:1})
  console.log(topic);
  res.json({topic});
})



// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected',socket.id);


  socket.on('joinRoom', async(room,user) => {
    try{
   const result=await Room.findOne({"roomid":room,"users":{$elemMatch:{$eq:user}}});
   console.log(result);
   if (result){
   socket.join(room);
   console.log(`User joined room ${room}`);
   }
   else{
    console.log("Unauthorised Access");
   }
  }
  catch(error){
    console.log("Error at joining room",error);
  }
  });

  socket.on('sendMessage', async(room, message,user) => {
    const mes=new Message({user:user,message:message,room:room})
    const newmes=await mes.save()
    console.log(newmes)
    io.to(room).emit('message', message,user);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
