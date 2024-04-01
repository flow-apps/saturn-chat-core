import { Server, Socket } from "socket.io";
import { http } from "../http";
import { validateJWT } from "../utils/validateJwt";
import { SubscriptionsService } from "../services/SubscriptionsService";

interface ISocketAuthenticated extends Socket {
  userID?: string;
}

interface ISocketPremium extends ISocketAuthenticated {
  isPremium: boolean;
}

const io = new Server(http, {
  cors: {
    optionsSuccessStatus: 200,
    credentials: true,
  },
});

io.use((socket: ISocketAuthenticated, _next) => {
  const token = socket.handshake.query.token;

  if (token) {
    validateJWT(String(token), (err, decoded: any) => {
      if (err) {
        socket.disconnect();
        console.log("WS >> Authenticate error");
        return _next(new Error("Authentication error"));
      }
      socket.userID = decoded.id;
      _next();
    });
  } else {
    socket.disconnect();
    console.log("WS >> Authenticate failed");
    return _next(new Error("Authentication error"));
  }
});

io.use(async (socket: ISocketPremium, _next) => {
  if (!socket.userID) {
    socket.isPremium = false;
    return _next();
  }

  const subscriptionsService = new SubscriptionsService();
  const subscription = await subscriptionsService.get(
    socket.userID,
    true,
    true
  );

  if (!subscription) {
    socket.isPremium = false;
    _next();
  }

  const isPremium = await subscriptionsService.isActive(subscription);

  socket.isPremium = isPremium;
  _next();
});

export { io, ISocketAuthenticated, ISocketPremium };
