const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// load environment variables
dotenv.config({ path: "./config.env" });

// connect to database
connectDB();

// import models
const User = require("./models/User");
const Message = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

const app = express();
const SERVER_PORT = 3000;

// middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// start server
const server = app.listen(SERVER_PORT, () =>
  console.log(`Server running on port ${SERVER_PORT}`)
);

const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// html routes
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "login.html"))
);
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "signup.html"))
);
app.get("/rooms", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "rooms.html"))
);
app.get("/chat", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "chat.html"))
);

// api endpoints
app.post("/signup", async (req, res) => {
  try {
    const { firstname, lastname, username, password } = req.body;

    if (!firstname || !lastname || !username || !password) {
      return res.status(400).send("All fields are required.");
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send("User already exists");

    const newUser = new User({ firstname, lastname, username, password });
    await newUser.save();

    console.log(`User created: ${username}`);
    res.status(201).send("User created successfully");
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).send("Error registering user");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔍 bcrypt.compare() result: ${isMatch}`);

    if (!isMatch) {
      console.log("Incorrect password for:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log(`Login successful for user: ${username}`);
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Error logging in user" });
  }
});

// store online users
let onlineUsers = {};

// websockets
io.on("connection", (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Handle when user enters the rooms lobby
  socket.on("join_lobby", (username) => {
    onlineUsers[socket.id] = { username, room: "Rooms Lobby" };
    io.emit("update_users", Object.values(onlineUsers)); // broadcast updated list
    console.log(`${username} is now in the Rooms Lobby`);
  });

  // join a room
  socket.on("join_group", async ({ username, room }) => {
    socket.join(room);
    console.log(`${username} joined room: ${room}`);

    // update user in onlineUsers object
    onlineUsers[socket.id] = { username, room };
    io.emit("update_users", Object.values(onlineUsers)); //broadcast updated list

    // send past messages from MongoDB
    const messages = await Message.find({ room }).sort({ date_sent: 1 });
    socket.emit("load_messages", messages);
  });

  // sending messages
  socket.on("group_message", async (data) => {
    const { username, room, message } = data;

    const newMessage = new Message({
      from_user: username,
      room: room,
      message: message,
    });

    await newMessage.save();

    io.to(room).emit("group_message", {
      from_user: username,
      message: message,
      date_sent: newMessage.date_sent,
    });
  });

  socket.on("private_message", async (data) => {
    const message = new PrivateMessage({
      from_user: data.from_user,
      to_user: data.to_user,
      message: data.message,
    });
    await message.save();
    io.to(data.to_user).emit("private_message", message);
  });

  // typing indicator
  socket.on("typing", (room) => {
    socket.to(room).emit("user_typing", { user: socket.id });
  });

  // leave room
  socket.on("leave_group", ({ username, room }) => {
    socket.leave(room);
    console.log(`${username} left room: ${room}`);

    // nove user back to the rooms lobby
    if (onlineUsers[socket.id]) {
      onlineUsers[socket.id].room = "Rooms Lobby";
    }
    io.emit("update_users", Object.values(onlineUsers)); // broadcast updated list
  });

  // disconnect user
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    delete onlineUsers[socket.id]; // remove user from list
    io.emit("update_users", Object.values(onlineUsers)); // broadcast updated list
  });
});
