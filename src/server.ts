import "reflect-metadata";
import "./websockets/group";
import "./websockets/message";
import { http } from "./http";

http.listen(process.env.PORT || 3000, () => console.log("Server started"));
