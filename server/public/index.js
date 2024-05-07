function main() {
  // Create the WebSockets
  const controlsWs = new WebSocket("ws://localhost:47653");
  const stream0Ws = new WebSocket("ws://localhost:47653/stream0");
  const stream1Ws = new WebSocket("ws://localhost:47653/stream1");
  stream0Ws.binaryType = "arraybuffer";
  stream1Ws.binaryType = "arraybuffer";
  var jmuxer0 = new JMuxer({
    node: "videoPlayer0",
    mode: "video",
    flushingTime: 0,
    readFpsFromTrack: true,
    maxDelay: 0,
  });
  var jmuxer1 = new JMuxer({
    node: "videoPlayer1",
    mode: "video",
    flushingTime: 0,
    readFpsFromTrack: true,
    maxDelay: 0,
  });

  // Object to track pressed keys
  const pressedKeys = {};

  // When a key is pressed down
  document.addEventListener("keydown", (event) => {
    if (!pressedKeys[event.key]) {
      pressedKeys[event.key] = true;
      console.log("Key pressed:", event.key);
      controlsWs.send(JSON.stringify({ key: event.key, down: true })); // Send the key to the server
    }
  });

  // When a key is lifted up
  document.addEventListener("keyup", (event) => {
    pressedKeys[event.key] = false;
    console.log("Key lifted:", event.key);
    controlsWs.send(JSON.stringify({ key: event.key, down: false })); // Send the key to the server
  });

  controlsWs.onopen = function () {
    console.log("Controls connection opened");
  };
  stream0Ws.onopen = function () {
    console.log("Stream 0 connection opened");
  };
  stream1Ws.onopen = function () {
    console.log("Stream 1 connection opened");
  };
  stream0Ws.onmessage = function (event) {
    jmuxer0.feed({
      video: new Uint8Array(event.data),
    });
  };
  stream1Ws.onmessage = function (event) {
    jmuxer1.feed({
      video: new Uint8Array(event.data),
    });
  };
  stream0Ws.onclose = function () {
    console.log("Stream 0 connection closed");
  };
  stream1Ws.onclose = function () {
    console.log("Stream 1 connection closed");
  };
}

main();
