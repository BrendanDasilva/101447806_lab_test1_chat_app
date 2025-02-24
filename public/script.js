const socket = io.connect("http://localhost:3000");

// handle login
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;

      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        sessionStorage.setItem("username", username);
        window.location.href = "/rooms";
      } else {
        document.getElementById("login-error").innerText =
          "Invalid username or password";
      }
    });
  }

  // handle signup
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const firstname = document.getElementById("firstname")?.value;
      const lastname = document.getElementById("lastname")?.value;
      const username = document.getElementById("signup-username")?.value;
      const password = document.getElementById("signup-password")?.value;

      if (!firstname || !lastname || !username || !password) {
        document.getElementById("signup-error").innerText =
          "All fields are required!";
        return;
      }

      const response = await fetch("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstname, lastname, username, password }),
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        document.getElementById("signup-error").innerText =
          "Signup failed. Please try again";
      }
    });
  }

  // handle group chat
  if (window.location.pathname === "/chat") {
    const username = sessionStorage.getItem("username");
    const room = sessionStorage.getItem("room");

    if (!username || !room) {
      window.location.href = "/"; // Redirect if session is not active
    }

    document.getElementById("room-title").innerText = `Room: ${room}`;

    // join the room
    socket.emit("join_group", { username, room });

    // load previous messages
    socket.on("load_messages", (messages) => {
      const messagesDiv = document.getElementById("messages");
      messages.forEach((msg) => {
        messagesDiv.innerHTML += `<p><strong>${msg.from_user}</strong>: ${msg.message}</p>`;
      });
    });

    // receive new message
    socket.on("group_message", (data) => {
      const messagesDiv = document.getElementById("messages");
      // const username = sessionStorage.getItem("username");

      // Create a message container div
      const messageElement = document.createElement("div");
      messageElement.classList.add("message");

      // Check if it's an outgoing or incoming message
      // const isSelf = data.from_user === sessionStorage.getItem("username");
      // messageDiv.classList.add(
      //   isSelf ? "message-outgoing" : "message-incoming"
      // );

      // format message content
      messagesDiv.innerHTML += `<p><strong>${data.from_user}</strong>: ${data.message}</p>`;

      messagesDiv.appendChild(messageElement);
      messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to new message
    });

    // send message
    document
      .getElementById("message-input")
      .addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
      });

    function sendMessage() {
      const messageInput = document.getElementById("message-input");
      const message = messageInput.value.trim();
      if (message === "") return;

      socket.emit("group_message", { username, room, message });

      messageInput.value = "";
      updateTypingIndicator(null); // Clear typing indicator
      socket.emit("stop_typing", room); // Notify server that user stopped typing
    }

    // typing indicator logic
    const messageInput = document.getElementById("message-input");
    messageInput.addEventListener("input", () => {
      if (messageInput.value.trim() !== "") {
        socket.emit("typing", { username, room });
      } else {
        socket.emit("stop_typing", room);
      }
    });

    socket.on("user_typing", (data) => {
      updateTypingIndicator(data.username);
    });

    socket.on("user_stopped_typing", (data) => {
      updateTypingIndicator(null);
    });

    function updateTypingIndicator(typingUser) {
      let typingIndicator = document.getElementById("typing-indicator");

      if (!typingIndicator) {
        typingIndicator = document.createElement("p");
        typingIndicator.id = "typing-indicator";
        typingIndicator.classList.add("text-muted");
        document.querySelector(".chat-box").appendChild(typingIndicator);
      }

      if (typingUser) {
        typingIndicator.innerText = `${typingUser} is typing...`;
        typingIndicator.style.display = "block";
      } else {
        typingIndicator.style.display = "none";
      }
    }

    // leave room
    function leaveRoom() {
      socket.emit("leave_group", { username, room });
      sessionStorage.removeItem("room");
      window.location.href = "/rooms";
    }

    // attach functions to global scope
    window.sendMessage = sendMessage;
    window.leaveRoom = leaveRoom;
  }
});

// handle room selection
function joinRoom(room) {
  sessionStorage.setItem("room", room);
  window.location.href = "/chat";
}

function goToPrivateMessages() {
  window.location.href = "/private_messages";
}

function goBackToRooms() {
  window.location.href = "/rooms";
}

function goBackToPrivateMessages() {
  window.location.href = "/private_messages";
}

document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname === "/private_messages") {
    const username = sessionStorage.getItem("username");

    if (!username) {
      window.location.href = "/";
    }

    // Join the lobby for online user tracking
    socket.emit("join_lobby", username);

    // Load online users
    socket.on("update_users", (users) => {
      const usersList = document.getElementById("users-list");
      usersList.innerHTML = ""; // Clear existing list

      const currentUser = sessionStorage.getItem("username");

      users.forEach((user) => {
        if (user.username !== currentUser) {
          const userItem = document.createElement("li");
          userItem.classList.add("user-item");

          userItem.innerHTML = `
        <div class="user-info">
          <span class="user-status">🟢</span>
          <span class="user-name">${user.username}</span>
        </div>
        <div class="user-room">${user.room}</div>
      `;

          userItem.onclick = () => openPrivateChat(user.username); // Make users clickable
          usersList.appendChild(userItem);
        }
      });
    });

    // Load existing private chats with last message
    fetch(`/get_private_chats/${username}`)
      .then((res) => res.json())
      .then((chatUsers) => {
        const privateChatsDiv = document.getElementById("private-chats");
        privateChatsDiv.innerHTML = ""; // Clear existing chat list

        chatUsers.forEach((chat) => {
          const chatButton = document.createElement("button");
          chatButton.className =
            "private-chat-item btn btn-light w-100 text-start";
          chatButton.onclick = () => openPrivateChat(chat.username);

          // Structure: Username + Last Message
          chatButton.innerHTML = `
            <div class="chat-username">${chat.username}</div>
            <div class="chat-last-message">${
              chat.lastMessage ? chat.lastMessage : "No messages yet"
            }</div>
          `;

          privateChatsDiv.appendChild(chatButton);
        });
      });
  }
});

// Function to start a new private chat
function startPrivateChat() {
  const privateUser = document.getElementById("private-user").value.trim();
  const currentUser = sessionStorage.getItem("username");

  if (privateUser && privateUser !== currentUser) {
    openPrivateChat(privateUser);
  }
}

// Function to open a private chat
function openPrivateChat(user) {
  sessionStorage.setItem("private_chat_with", user);
  window.location.href = "/chat_private";
}

document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname === "/chat_private") {
    const username = sessionStorage.getItem("username");
    const privateChatWith = sessionStorage.getItem("private_chat_with");

    if (!username || !privateChatWith) {
      window.location.href = "/private_messages";
    }

    document.getElementById(
      "private-chat-title"
    ).innerText = `Chat with ${privateChatWith}`;

    // Keep user in online list
    socket.emit("join_lobby", username);

    // Fetch existing private messages
    fetch(`/get_private_messages/${username}/${privateChatWith}`)
      .then((res) => res.json())
      .then((messages) => {
        const messagesDiv = document.getElementById("messages");
        messagesDiv.innerHTML = ""; // Clear old messages

        messages.forEach((msg) => {
          messagesDiv.innerHTML += `<p><strong>${msg.from_user}</strong>: ${msg.message}</p>`;
        });
      })
      .catch((err) => console.error("Error loading private messages:", err));
  }
});

// send private chat
function sendPrivateMessage() {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  const fromUser = sessionStorage.getItem("username");
  const toUser = sessionStorage.getItem("private_chat_with");

  if (message === "") return;

  // Emit message to server
  socket.emit("private_message", {
    from_user: fromUser,
    to_user: toUser,
    message,
  });

  // Ensure message appears only once for the sender
  const messagesDiv = document.getElementById("messages");
  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${fromUser}</strong>: ${message}`;
  messagesDiv.appendChild(messageElement);

  messageInput.value = "";
}

// Handle incoming private messages
socket.on("private_message", (data) => {
  const messagesDiv = document.getElementById("messages");

  // Prevent duplicate messages
  const existingMessages = messagesDiv.innerHTML;
  if (!existingMessages.includes(`${data.from_user}: ${data.message}`)) {
    messagesDiv.innerHTML += `<p><strong>${data.from_user}</strong>: ${data.message}</p>`;
  }
});

// logout
function handleLogout() {
  sessionStorage.clear();
  window.location.href = "/";
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);
});

// handle online users list update
socket.on("update_users", (users) => {
  const usersList = document.getElementById("users-list");
  usersList.innerHTML = ""; // Clear existing list

  const currentUser = sessionStorage.getItem("username");

  users.forEach((user) => {
    if (user.username !== currentUser) {
      const userItem = document.createElement("li");
      userItem.classList.add("user-item");

      userItem.innerHTML = `
        <div class="user-info">
          <span class="user-status">🟢</span>
          <span class="user-name">${user.username}</span>
        </div>
        <div class="user-room">${user.room}</div>
      `;

      userItem.onclick = () => openPrivateChat(user.username); // Make users clickable
      usersList.appendChild(userItem);
    }
  });
});

// hamburger menu for online users below 500px

// detect if the user is in the rooms selection page
if (window.location.pathname === "/rooms") {
  const username = sessionStorage.getItem("username");
  if (username) {
    socket.emit("join_lobby", username); // send event to mark user as in the lobby
  }
}
