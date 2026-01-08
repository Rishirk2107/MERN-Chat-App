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
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true
    },
    mobileNumber: {
        type: String,
        required: false
    },
    dob: {
        type: Date,
        required: false
    },
    gender: {
        type: String,
        enum: ['male','female','other','prefer_not_say'],
        required: false
    },
    state: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    bio: {
        type: String,
        required: false
    },
    userid:{
        type:Number,
        unique:true
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

// Counter collection for auto-incrementing ids
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Pre-save hook to assign an auto-incrementing `userid`
UserSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { _id: 'userid' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.userid = counter.seq;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

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
        type:[Number],
        default:[]
    },
    admin:{
        type:Number,
        required:true
    }
})

const Room=mongoose.model("Rooms",roomSchema);

const messageSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },

  user: {
    type: String,
    required: true
  },

  room: {
    type: String,
    required: true
  },

    // message type: text, file, or call
    type: {
        type: String,
        enum: ["text", "file", "call"],
        default: "text"
    },
    // for call messages: attended, rejected, missed
    callStatus: {
        type: String,
        enum: ["attended", "rejected", "missed"],
        required: function () {
            return this.type === "call";
        },
    },
    // optional: call duration in seconds
    callDuration: {
        type: Number,
        required: false
    },
  
    // unique message identifier (stringified ObjectId)
    messageId: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
        index: true,
        unique: true
    },

    // numeric sender id for reliable comparisons
    senderId: {
        type: Number,
        required: false
    },

  // only required for text messages
  message: {
    type: String,
    required: function () {
      return this.type === "text";
    }
  },

  // Cloudinary file metadata
  file: {
    publicId: { type: String },      // Cloudinary public_id
    url: { type: String },           // secure_url
    originalName: { type: String },  // original file name
    format: { type: String },        // jpg, png, pdf, mp4
    resourceType: { type: String },  // image, video, raw
    bytes: { type: Number }          // file size
  },

    // delivery/read timestamps
    deliveredAt: {
        type: Date,
        required: false
    },
    readAt: {
        type: Date,
        required: false
    },

  createdAt: {
    type: Date,
    default: Date.now
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
        type:Number,
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
    userid:{
        type:Number,
        required:true
    },
    username:{
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

// Friend schema - store requester/recipient as objects to keep user snapshot
const friendSchema = new mongoose.Schema({
    requester: {
        userid: { type: Number, required: true },
        username: { type: String },
        name: { type: String },
        email: { type: String }
    },
    recipient: {
        userid: { type: Number, required: true },
        username: { type: String },
        name: { type: String },
        email: { type: String }
    },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Friend = mongoose.model('Friend', friendSchema);

module.exports.Friend = Friend;

