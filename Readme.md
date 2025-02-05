# Real-Time Chat Application

## Overview

This is a real-time chat application built using **Node.js**, **Express.js**, **MongoDB**, **Socket.io**, and **Bootstrap** for styling. It allows users to sign up, log in, and participate in public chat rooms with real-time messaging. The application also tracks online users and allows for future implementation of private messaging. We had a 12-hour time window to complete this challenge.

You can view a quick walkthrough here: https://youtu.be/wrBkJihn8Zo

## Features

- **User Authentication:** Sign up and log in functionality using **bcrypt.js** for password hashing.
- **Real-Time Messaging:** Messages are sent and received instantly using **Socket.io**.
- **Chat Rooms:** Users can join predefined chat rooms (Sports, Technology, Movies, Gaming, Random) and view chat history.
- **Online Users List:** Displays currently online users and their respective chat rooms.
- **Typing Indicator:** Shows when a user is typing in a chat room.
- **Session Tracking:** Uses **sessionStorage** (in progress) to maintain user sessions.
- **Responsive UI:** Styled with **Bootstrap** for a clean and user-friendly experience.

## Future Enhancements

- **Private Messaging:** One-on-one chat functionality with message history.
- **Session Persistence:** Full conversion from `localStorage` to `sessionStorage` to prevent session overwrites.
- **Improved Typing Indicator:** Ensuring it disappears when a user stops typing rather than a set timeout.
- **User Profiles:** Display user avatars and additional info in chat.

## Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (Ensure it's installed on your machine)
- MongoDB (Local or [MongoDB Atlas](https://www.mongodb.com/atlas/database))

### Steps

1. Clone this repository:
   ```sh
   git clone https://github.com/your-username/chat-app.git
   cd chat-app
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the root directory and set up the following variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ```
4. Start the server:
   ```sh
   node server.js
   ```
5. Open your browser and go to:
   ```sh
   http://localhost:3000
   ```

## File Structure

```
chat-app/
│-- config/
│   ├── db.js  # Database connection setup
│-- models/
│   ├── User.js  # User schema
│   ├── GroupMessage.js  # Group message schema
│   ├── PrivateMessage.js  # Private message schema
│-- public/
│   ├── styles.css  # CSS styles
│   ├── script.js  # Frontend JavaScript
│-- views/
│   ├── login.html  # Login page
│   ├── signup.html  # Signup page
│   ├── rooms.html  # Room selection page
│   ├── chat.html  # Chatroom page
│-- server.js  # Main Express server
│-- package.json  # Dependencies
```

## Technologies Used

- **Backend:** Node.js, Express.js, MongoDB, Mongoose, bcrypt.js, dotenv
- **Frontend:** HTML, CSS (Bootstrap), JavaScript
- **Real-Time Communication:** Socket.io

## Bug Fixes and Future Additions

- Need to convert localStorage to sessionStorage (in local development when I try to run 2 tabs to test the second user overwrites the first)
- Someone is typing needs to be changed to show WHO is typing

- Private messaging structure is set up but not implemented

## Author

Developed by **Brendan Dasilva**.
