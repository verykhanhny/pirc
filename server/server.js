const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/public/script.js');
});

// Store client connections
const clients = new Set();

// WebSocket connection event
wss.on('connection', function connection(ws) {
  console.log('A new client connected');
  clients.add(ws);

  // When receiving a message from a client
  ws.on('message', function incoming(message) {
    console.log('Received: %s', message);
    for (let client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString())
      }
    }
  });

  // When a client closes the connection
  ws.on('close', function() {
    console.log('A client disconnected');
    clients.delete(ws);
  });
});

// Start the server
const PORT = process.env.PORT || 12345;
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});