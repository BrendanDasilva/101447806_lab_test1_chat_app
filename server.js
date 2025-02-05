const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const SERVER_PORT = 3000;

// middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/chatApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// start server
const server = app.listen(SERVER_PORT, () =>
  console.log(`Server running on port ${SERVER_PORT}`)
);

// html routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "chat.html"));
});
app.get("/group", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "group.html"));
});
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "signup.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// api endpoints
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send("User already exists");

    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).send("User created successfully");
  } catch (err) {
    res.status(500).send("Error registering user");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).send("Invalid username or password");

    res.status(200).send({ message: "Login successful" });
  } catch (err) {
    res.status(500).send("Error logging in");
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

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
