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
app.use(express.static(path.join(__dirname, "public")));

// start server
const server = app.listen(SERVER_PORT, () =>
  console.log(`Server running on port ${SERVER_PORT}`)
);

// html routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "signup.html"));
});
app.get("/rooms", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "rooms.html"));
});

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
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("Invalid username or password");
    }

    res.status(200).send("Login successful");
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send("Error logging in user");
  }
});

// websockets
const io = socketio(server);
io.on("connection", (socket) => {
  console.log(`New user connected:" ${socket.id}`);

  socket.on("join_group", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room: ${room}`);
  });

  socket.on("leave_group", (room) => {
    socket.leave(room);
    console.log(`${socket.id} left room: ${room}`);
  });

  socket.on("group_message", async (data) => {
    const message = new Message({
      from_user: data.username,
      room: data.room,
      message: data.message,
    });
    await message.save();
    io.to(data.room).emit("group_message", message);
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

  socket.on("typing", (room) => {
    socket.to(room).emit("user_typing", { user: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
