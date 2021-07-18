import { Server, Socket } from "socket.io";
import { http } from "../http";
import { validateJWT } from "../utils/validateJwt";

interface ISocketAuthenticated extends Socket {
  userID?: string;
}

const io = new Server(http);

io.use((socket: ISocketAuthenticated, _next) => {
  const token = socket.handshake.query.token;

  if (token) {
    validateJWT(String(token), (err, decoded: any) => {
      if (err) {
        socket.disconnect();
        console.log("WS >> Authenticate error")
        return _next(new Error("Authentication error"));
      }
      socket.userID = decoded.id;
      _next();
    });
  } else {
    socket.disconnect();
    console.log("WS >> Authenticate failed")
    return _next(new Error("Authentication error"));
  }
});

export { io, ISocketAuthenticated };
