import { io, ISocketAuthenticated } from ".";

io.on("connection", async (socket: ISocketAuthenticated) => {
  console.log(socket.userID);
});
