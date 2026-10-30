import { io } from "socket.io-client";
import { authService } from "./services/authService.js";

const SERVER_URL = (import.meta.env.VITE_SERVER_URL || "http://localhost:5001").replace(/\/+$/, "");

const initialToken = authService.getToken();

export const socket = io(SERVER_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: {
    token: null
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export function connectSocket(token) {
  const finalToken = token || authService.getToken();
  if (!finalToken) return;
  socket.auth = { token: finalToken };
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.disconnect();
}
