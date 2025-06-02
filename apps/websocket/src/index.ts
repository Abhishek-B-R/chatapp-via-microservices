import { WebSocketServer,WebSocket } from "ws";
import axios from "axios";

const wss = new WebSocketServer({ port: 8080 });

interface Client {
  socket: WebSocket;
  room: string;
  name: string;
}

let clients: Client[] = [];

wss.on("connection", (socket: WebSocket) => {
  socket.on("message", async (e) => {
    const msg = JSON.parse(e.toString());
    const { type, payload } = msg;

  if (type === "join") {
    clients.push({ socket, room: payload.room, name: payload.name });

    // Inform backend of the join
    await axios.post("http://chatapp-backend:4000/join", payload);

    // Fetch room data from backend
    let roomData = null;
    try {
      const response = await axios.get(`http://chatapp-backend:4000/rooms/${payload.room}/messages`);
      roomData = response.data;
    } catch (err) {
      if (err instanceof Error) {
        console.error("Failed to fetch room data:", err.message);
      } else {
        console.error("Failed to fetch room data:", JSON.stringify(err).slice(0, 2000));
      }
    }

    // Send existing room data to the joining user
    if (roomData) {
      socket.send(
        JSON.stringify({
          type: "history",
          data: roomData,
        })
      );
    }

    // Broadcast updated participant list to the room
    const names = clients
      .filter((c) => c.room === payload.room)
      .map((c) => c.name);

    broadcastToRoom(payload.room, {
      type: "participant",
      name: names,
    });
  }


    if (type === "chat") {
      const sender = clients.find((c) => c.socket === socket);
      if (!sender) return;

      await axios.post("http://chatapp-backend:4000/messages", {
        room: sender.room,
        name: sender.name,
        message: payload.message,
      });

      broadcastToRoom(sender.room, {
        type: "chat",
        name: sender.name,
        message: payload.message,
      });
    }

    if (type === "exit") {
      clients = clients.filter((c) => !(c.room === payload.room && c.name === payload.name));

      await axios.post("http://chatapp-backend:4000/exit", payload);

      const names = clients
        .filter((c) => c.room === payload.room)
        .map((c) => c.name);

      broadcastToRoom(payload.room, {
        type: "participant",
        name: names,
      });
    }

    socket.on("close", () => {
      const user = clients.find((c) => c.socket === socket);
      if (!user) return;
      clients = clients.filter((c) => c.socket !== socket);
      broadcastToRoom(user.room, {
        type: "participant",
        name: clients.filter((c) => c.room === user.room).map((c) => c.name),
      });
    });
  });
});

function broadcastToRoom(room: string, data: any) {
  clients.filter((c) => c.room === room).forEach((c) =>
    c.socket.send(JSON.stringify(data))
  );
}
