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
});

// handle room selection
function joinRoom(room) {
  localStorage.setItem("room", room);
  window.location.href = "/chat";
}
