import { io, type Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

function loadOrCreateClientId(): string {
  const key = "board-webapp-clientId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export const clientId = loadOrCreateClientId();
export const socket: Socket = io(SERVER_URL, { autoConnect: true });

export function loadOrCreateName(): string {
  const key = "board-webapp-name";
  return localStorage.getItem(key) ?? "";
}

export function saveName(name: string) {
  localStorage.setItem("board-webapp-name", name);
}
