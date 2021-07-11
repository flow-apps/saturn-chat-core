import "reflect-metadata";
import "./websockets/group";
import "./websockets/message";
import { http } from "./http";

http.listen(3000, () => console.log("Server started in port 3000"));
