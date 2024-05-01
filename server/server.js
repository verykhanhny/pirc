const express = require("express");
const ws = require("express-ws");
const session = require("express-session");
const crypto = require("crypto");
const dotenv = require("dotenv");

// Middleware to check if user is logged in
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    next(); // User is logged in, proceed
  } else {
    res.redirect("/login"); // User is not logged in, redirect to login page
  }
}

function alreadyLogin(req, res, next) {
  if (req.session && req.session.user) {
    res.redirect("/"); // User is logged in, redirect to root page
  } else {
    next();
  }
}

function main() {
  dotenv.config();
  const app = express();
  ws(app);

  // Store clients connection
  const clients = new Set();

  // Use sessions for tracking logged-in users
  app.use(
    session({
      name: "pirc.session",
      secret: process.env.secret,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 2592000000,
      },
    })
  );

  // Login route
  app.get("/login", alreadyLogin, (_, res) => {
    res.sendFile(__dirname + "/public/login.html");
  });
  app.get("/login.js", alreadyLogin, (_, res) => {
    res.sendFile(__dirname + "/public/login.js");
  });
  app.get("/salt", (_, res) => {
    res.send(process.env.client_salt);
  });

  // Post login route
  app.post("/login", express.json(), (req, res) => {
    const { username, password } = req.body;
    crypto.pbkdf2(
      password,
      process.env.server_salt,
      1000000,
      64,
      "sha512",
      (err, derivedKey) => {
        if (err) {
          res.status(500).send("Internal Server Error");
        } else {
          if (
            username === process.env.username &&
            derivedKey.toString("hex") === process.env.admin_key
          ) {
            req.session.user = username; // Set user in session
            res.send("Authenticated");
          } else {
            res.status(401).send("Unauthenticated");
          }
        }
      }
    );
  });

  // Root route
  app.get("/", requireLogin, (_, res) => {
    res.sendFile(__dirname + "/public/index.html");
  });
  app.get("/index.js", requireLogin, (_, res) => {
    res.sendFile(__dirname + "/public/index.js");
  });

  // WebSocket connection event
  app.ws("/", function connection(ws, req) {
    console.log("A new client connected");
    if (req.session && req.session.user) {
      console.log("Client authenticated");
      clients.add(ws);
    } else {
      console.log("Client unauthenticated");
      ws.send(
        JSON.stringify({
          code: 401,
          message: "Unauthenticated",
        })
      );
      ws.close();
    }

    // When receiving a message from a client
    ws.on("message", function incoming(message) {
      console.log("Received: %s", message);
      for (let client of clients) {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(message.toString());
        }
      }
    });

    // When a client closes the connection
    ws.on("close", function () {
      console.log("A client disconnected");
      clients.delete(ws);
    });
  });

  // Start the server
  app.listen(12345, () => {
    console.log(`Server started on http://localhost:12345`);
  });
}

main();
