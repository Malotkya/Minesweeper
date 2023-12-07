import * as express from "express";
import {createServer} from "http";
import {Server} from "socket.io"
import * as path from "path";
import * as Session from "express-session";

import Minesweeper from "./Game";

const expressApp = express();
const httpServer = createServer(expressApp);
const scoketApp = new Server(httpServer);

const sessionMiddleware = Session({
    secret: "minesweeper",
    resave: true,
    saveUninitialized: true
});

expressApp.use(sessionMiddleware);
scoketApp.engine.use(sessionMiddleware);

expressApp.use(express.static(path.join(__dirname, "public")));

scoketApp.on('connection', Minesweeper);

httpServer.listen(3000, ()=>{
    console.log("Server is running!");
});
