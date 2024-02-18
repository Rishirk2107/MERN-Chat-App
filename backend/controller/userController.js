const User=require("../models/userModel");
const asyncHandler=require("express-async-handler");
const generateToken=require("../config/generateToken");

const registerUser=asyncHandler(async(req,res)=>{
    const {name,email,password,pic}=req.body;
    console.log(name,email)

    if(!name ||  !email || !password){
        res.status(400)
    }


const userExists=await User.findOne({email});
console.log(userExists);

if (userExists){
    res.status(400);
    throw new Error("User Already Exists");
}

const user=new User({
    name,
    email,
    password,
    pic
});

const result=await user.save();
console.log(user,result);

if (user){
    res.status(201).json({
       _id:user._id,
       message:"Hello",
       name:user.name,
       email:user.email,
       password:password,
       pic:user.pic, 
       token:generateToken(user._id)
    })
}
else{
    res.status(400);
    throw new Error("Failed to Create the User");
}
});

const authUser=asyncHandler(async (req,res)=>{
 const {email,password}=req.body;

 const user=await User.findOne({email});
 if(user && (await user.matchPassword(password))){
    res.json({
        _id:user._id,
        message:"Hello",
        password:password,
        name:user.name,
        email:user.email,
        pic:user.pic, 
        token:generateToken(user._id)
 })
 }
 else{
    res.status(401);
    throw new Error("Invalid Email or Password")
 }
})

module.exports={registerUser,authUser}