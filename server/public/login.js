function login() {
  // Create an XMLHttpRequest object
  const xhr = new XMLHttpRequest();

  // Configure the request
  xhr.open("GET", "/salt");
  xhr.setRequestHeader("Content-Type", "text/html");

  // Set up event handler for when the request completes
  xhr.onload = function () {
    if (xhr.status === 200) {
      // Successful login
      sendPassword(xhr.responseText);
    } else {
      failedLogin();
    }
  };

  xhr.send();
}

function sendPassword(salt) {
  // Get form data
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  hashPassword(password, salt, (err, hash) => {
    if (err) {
      failedLogin();
    } else {
      // Create an XMLHttpRequest object
      const xhr = new XMLHttpRequest();

      // Configure the request
      xhr.open("POST", "/login");
      xhr.setRequestHeader("Content-Type", "application/json");

      // Define the request body
      const body = JSON.stringify({ username: username, password: hash });

      // Set up event handler for when the request completes
      xhr.onload = function () {
        if (xhr.status === 200) {
          // Successful login
          window.location.href = "/"; // Redirect to home page
        } else {
          failedLogin();
        }
      };

      // Send the request
      xhr.send(body);
    }
  });
}

function hashPassword(password, salt, callback) {
  // Convert password to ArrayBuffer
  var passwordBuffer = new TextEncoder().encode(password + salt);

  // Hash the password using SHA-256
  window.crypto.subtle
    .digest("SHA-512", passwordBuffer)
    .then(function (hashBuffer) {
      // Convert the hash ArrayBuffer to a hex string
      var hashArray = Array.from(new Uint8Array(hashBuffer));
      var hashHex = hashArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      callback(null, hashHex);
    })
    .catch(function (err) {
      callback(err);
    });
}

function failedLogin() {
  // Failed login
  document.getElementById("message").innerText = `Login failed.`;
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// Event listener for key press in username field
document
  .getElementById("username")
  .addEventListener("keypress", function (event) {
    // Check if the key pressed is Enter
    if (event.key === "Enter") {
      login(); // Call the function
    }
  });

// Event listener for key press in password field
document
  .getElementById("password")
  .addEventListener("keypress", function (event) {
    // Check if the key pressed is Enter
    if (event.key === "Enter") {
      login(); // Call the function
    }
  });
