const mongoose=require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true,
  useUnifiedTopology: true,
})

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    rooms:{
        type:[String],
        default:[]
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

const User=mongoose.model("User",UserSchema);

const roomSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    roomid:{
        type:String,
        required:true
    },
    users:{
        type:[String],
        default:[]
    },
    admin:{
        type:String,
        required:true
    }
})

const Room=mongoose.model("Rooms",roomSchema);

const messageSchema=new mongoose.Schema({
    user:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    room:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

const Message=mongoose.model("Messages",messageSchema);

module.exports={User,Room,Message};