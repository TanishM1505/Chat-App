import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create express app using http server
const app = express();
const server = http.createServer(app); //Using http server bcuz socket.io supports http server

//Initalise socket.io Server
export const io = new Server(server, {
  cors: { origin: "*" },
});

//Store Online Users
export const userSocketMap = {}; //Obj to Store the data of all the online users in form of user id and socket id {userId:socketId}

//Socket.io Connection Handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  //Emit online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers",Object.keys(userSocketMap));
  });
});

//Middleware Setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//Routes setup
app.use("/api/status", (req, res) => res.send("Server is Live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//Connect to Mongodb
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is Running on Port: " + PORT));
