import "dotenv/config"
import "reflect-metadata";
import "./websockets/group";
import "./websockets/message";
import "./websockets/app";
import { http } from "./http";

http.listen(process.env.PORT || 3000, () => console.log(`Server started in port ${process.env.PORT || 3000}`));
