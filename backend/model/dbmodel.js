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
});

const Message=mongoose.model("Messages",messageSchema);

const anonymousroomschema=new mongoose.Schema({
    topic:{
        title:{
            type:String,
        required:true
        },
        details:{
            type:String,
        required:true
        }
    },
    topicId:{
        type:String,
        required:true
    },

    createdBy:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

const Anonymousrooms=mongoose.model("Anonymous-room",anonymousroomschema);

const Anonymouschatsschema=new mongoose.Schema({
    replyId:{
        type:String,
        required:true
    },
    topicId:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
    
});

const Anonymouschat=mongoose.model("Anonymous-chat",Anonymouschatsschema)

module.exports={User,Room,Message,Anonymousrooms,Anonymouschat};

