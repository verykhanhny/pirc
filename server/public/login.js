function login() {
  // Get form data
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Create an XMLHttpRequest object
  const xhr = new XMLHttpRequest();

  // Configure the request
  xhr.open("POST", "/login");
  xhr.setRequestHeader("Content-Type", "application/json");

  // Define the request body
  const body = JSON.stringify({ username: username, password: password });

  // Set up event handler for when the request completes
  xhr.onload = function () {
    if (xhr.status === 200) {
      // Successful login
      window.location.href = "/"; // Redirect to home page
    } else {
      // Failed login
      document.getElementById("message").innerText =
        `Login failed. ${xhr.responseText}`;
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
    }
  };

  // Send the request
  xhr.send(body);
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
