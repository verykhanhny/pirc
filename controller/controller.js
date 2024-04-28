const https = require("https");
const websocket = require("ws");
const crypto = require("crypto");
require("dotenv").config();

// Login cookie
let cookie = [];

// Send data in chunks every second
let intervalId = 0;

function getSalt(callback) {
  const options = {
    hostname: "internal.khanhduong.dev",
    port: 61386,
    path: "/salt",
    method: "GET",
    headers: {
      "Content-Type": "text/html",
    },
  };

  const req = https.request(options, (res) => {
    let data = "";

    // A chunk of data has been received.
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        callback(data);
      } else {
        console.log("Login failed:", data);
        setTimeout(login, 3000);
      }
    });
  });

  // Handle error
  req.on("error", (error) => {
    console.log("Error:", error);
    setTimeout(login, 3000);
  });

  // Get salt
  req.end();
}

function login() {
  getSalt((salt) => {
    const saltedPassword = process.env.password + salt;
    const hash = crypto.createHash("sha256");
    hash.update(saltedPassword);
    const hashedPassword = hash.digest("hex");
    const loginData = JSON.stringify({
      username: process.env.username,
      password: hashedPassword,
    });

    const options = {
      hostname: "internal.khanhduong.dev",
      port: 61386,
      path: "/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": loginData.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      // A chunk of data has been received.
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          // Save received session cookie in the client
          console.log("Login successful!");
          cookie = res.headers["set-cookie"];
          connect();
        } else {
          console.log("Login failed:", data);
          setTimeout(login, 3000);
        }
      });
    });

    // Handle error
    req.on("error", (error) => {
      console.log("Error:", error);
      setTimeout(login, 3000);
    });

    // Send login data
    req.write(loginData);
    req.end();
  });
}

login();

function connect() {
  console.log("Connecting to WebSocket...");
  const ws = new websocket("wss://internal.khanhduong.dev:61386", {
    headers: {
      cookie: cookie,
    },
  });

  ws.onopen = function () {
    console.log("WebSocket connection opened");
    intervalId = setInterval(() => {
      ws.send(generateData());
    }, 1000);
  };

  ws.onmessage = function (event) {
    const message = JSON.parse(event.data);
    console.log("Received: %s", message);
    // Got error so try to login again
    if (message.code) {
      ws.close();
    }
  };

  ws.onerror = function (error) {
    console.log("Websocket error: %s", error.message);
  };

  ws.onclose = function () {
    console.log("WebSocket connection closed");
    clearInterval(intervalId);
    setTimeout(login, 3000);
  };
}

// Generate random data
function generateData() {
  return Math.random().toString();
}
