const WebSocket = require('ws');

// Send data in chunks every second
let intervalId = 0

function connect() {
  console.log('Connecting to WebSocket...');
  const ws = new WebSocket('ws://localhost:12345');

  ws.onopen = function () {
    console.log('WebSocket connection opened');
    intervalId = setInterval(() => {
      ws.send(generateData());
    }, 1000);
  };

  ws.onmessage = function (event) {
    console.log('Received: %s', JSON.parse(event.data))
  };

  ws.onerror = function(error) {
    console.log('Websocket error: %s', error.message)
  }

  ws.onclose = function () {
    console.log('WebSocket connection closed');
    clearInterval(intervalId)
    setTimeout(connect, 3000)
  }
}

// Generate random data
function generateData() {
  return Math.random().toString();
}

connect()