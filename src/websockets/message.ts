import { io, ISocketAuthenticated } from ".";
import { MessagesService } from "../services/MessagesService";

io.on("connection", async (socket: ISocketAuthenticated) => {
  const messagesService = new MessagesService();
  const userID = socket.userID;
  const groupID = String(socket.handshake.query.group_id);

  console.log(`Socket ${socket.id} conectado no grupo ${groupID}`);

  socket.join(groupID);
  socket.on("new_user_message", async (data: { message: string }) => {
    const createdMessage = await messagesService.create({
      author_id: userID,
      group_id: groupID,
      message: data.message,
    });

    console.log(createdMessage);

    socket.emit("sended_user_message", createdMessage);
    socket.in(groupID).emit("new_user_message", createdMessage);
  });
});
