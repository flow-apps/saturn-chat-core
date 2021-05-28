import { io } from "../http";

io.on("connection", async (socket) => {
  const queries = socket.handshake.query;

  console.log(`Socket conectado: ${socket.id}`);
  console.log(`Queries do socket: `, queries);
});
