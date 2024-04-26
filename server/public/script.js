const ws = new WebSocket('wss://internal.khanhduong.dev:61386');
const pressedKeys = {}; // Object to track pressed keys

// When a key is pressed down
document.addEventListener('keydown', (event) => {
  if (!pressedKeys[event.key]) {
    pressedKeys[event.key] = true
    console.log('Key pressed:', event.key);
    ws.send(JSON.stringify({"key": event.key, "down": true})); // Send the key to the server
  }
});

// When a key is lifted up
document.addEventListener('keyup', (event) => {
  pressedKeys[event.key] = false
  console.log('Key lifted:', event.key);
  ws.send(JSON.stringify({"key": event.key, "down": false})); // Send the key to the server
});

ws.onopen = function () {
  console.log('WebSocket connection opened');
};

ws.onmessage = function (event) {
  const messagesDiv = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.textContent = event.data;
  messagesDiv.appendChild(messageDiv);
};

ws.onclose = function () {
  console.log('WebSocket connection closed');
};

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;
  ws.send(message);
  messageInput.value = '';
}