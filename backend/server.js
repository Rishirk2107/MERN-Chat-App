const express=require("express");
const dotenv=require('dotenv');
const cors=require("cors");
const userRoutes=require("./routes/userRoutes");
const {chats}=require("./data/data");
const connectDB = require("./config/db");
const {notFound,errorHandler}=require("./middleware.js/errorMiddleware")

const app=express();
app.use(express.json());
app.use(cors());
dotenv.config();
PORT=process.env.PORT || 5000;
connectDB();

// app.get("/",(req,res)=>{
//     console.log(chats)
//     res.send("Hello World");
// });

// app.get("/api/chat/",(req,res)=>{
//     console.log(chats)
//     res.json(chats);
// });

app.use("/api/user",userRoutes);

// app.get("/api/chat/:id",(req,res)=>{
//     //console.log(req.params.id);
//     const singleChat=chats.find((c)=>c._id===req.params.id)
//     console.log(singleChat);
//     res.send(singleChat);
// })

app.use(notFound);
app.use(errorHandler);

app.listen(5000,()=>{
    console.log(`Server running on http://localhost:${PORT}/`)
})