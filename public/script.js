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
        localStorage.setItem("username", username);
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
    const username = localStorage.getItem("username");
    const room = localStorage.getItem("room");

    if (!username || !room) {
      window.location.href = "/"; // if no session user gets redirected back to login
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
      messagesDiv.innerHTML += `<p><strong>${data.from_user}</strong>: ${data.message}</p>`;
    });

    // send message
    document
      .getElementById("message-input")
      .addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
      });

    function sendMessage() {
      const message = document.getElementById("message-input").value.trim();
      if (message === "") return;

      socket.emit("group_message", { username, room, message });

      document.getElementById("message-input").value = "";
    }

    // typing indicator
    function notifyTyping() {
      socket.emit("typing", room);
    }

    socket.on("user_typing", (data) => {
      document.getElementById("typing-indicator").innerText =
        "Someone is typing...";
      setTimeout(() => {
        document.getElementById("typing-indicator").innerText = "";
      }, 3000);
    });

    // leave room
    function leaveRoom() {
      socket.emit("leave_group", { username, room });
      localStorage.removeItem("room");
      window.location.href = "/rooms";
    }

    // attach functions to global scope
    window.sendMessage = sendMessage;
    window.notifyTyping = notifyTyping;
    window.leaveRoom = leaveRoom;
  }
});

// handle room selection
function joinRoom(room) {
  localStorage.setItem("room", room);
  window.location.href = "/chat";
}

// logout
document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("room");
  window.location.href = "/";
});

// handle online users list update
socket.on("update_users", (users) => {
  const usersList = document.getElementById("users-list");
  usersList.innerHTML = ""; // clear existing list

  users.forEach((user) => {
    const userItem = document.createElement("li");
    userItem.textContent = `${user.username} (${user.room})`;
    usersList.appendChild(userItem);
  });
});

// detect if the user is in the rooms selection page
if (window.location.pathname === "/rooms") {
  const username = localStorage.getItem("username");
  if (username) {
    socket.emit("join_lobby", username); // send event to mark user as in the lobby
  }
}
