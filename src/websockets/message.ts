import { io, ISocketAuthenticated } from ".";
import { MessagesService } from "../services/MessagesService";

io.on("connection", async (socket: ISocketAuthenticated) => {
  const messagesService = new MessagesService();
  const userID = socket.userID;
  let groupID: string;

  socket.on("connect_in_chat", async (id: string) => {
    socket.join(id);
    groupID = id;
    console.log(`Socket ${socket.id} conectado no grupo ${id}`);
  });

  socket.on("new_user_message", async (data: { message: string }) => {
    const createdMessage = await messagesService.create({
      author_id: userID,
      group_id: groupID,
      message: data.message,
    });
    socket.emit("sended_user_message", createdMessage);
    socket.in(groupID).emit("new_user_message", createdMessage);
  });

  socket.on("new_voice_message", async (data) => {
    const newVoiceMessage = await messagesService.createAudio({
      audio: data.audio,
      author_id: userID,
      group_id: groupID,
      message: data.message,
    });

    socket.emit("sended_user_message", newVoiceMessage);
    socket.in(groupID).emit("new_user_message", newVoiceMessage);
  });

  socket.on("new_message_with_files", async (data) => {
    const newMessageWithFiles = await messagesService.createWithFiles({
      author_id: userID,
      group_id: groupID,
      message: data.message,
      files: data.files,
    });

    socket.emit("sended_user_message", newMessageWithFiles);
    socket.in(groupID).emit("new_user_message", newMessageWithFiles);
  });

  socket.on("delete_user_message", async (messageID: string) => {
    await messagesService.delete(messageID, userID);
    socket.in(groupID).emit("delete_user_message", messageID);
    socket.emit("delete_user_message", messageID);
  });
});
