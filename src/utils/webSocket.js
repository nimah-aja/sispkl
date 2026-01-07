// src/utils/websocket.js

let socket = null;

export const connectWS = (onMessage) => {
  socket = new WebSocket("wss://api.gedanggoreng.com/ws");

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data); // kirim ke page
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };
};

export const disconnectWS = () => {
  if (socket) {
    socket.close();
  }
};
