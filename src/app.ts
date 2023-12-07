import * as express from "express";
import {createServer, IncomingMessage} from "http";
import {Server, Socket} from "socket.io"
import * as path from "path";
import * as Session from "express-session";

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

expressApp.use(express.static(path.join(process.cwd(), "public")));

interface SessionMessage extends IncomingMessage {
    session: any
}

interface SessionSocket extends Socket {
    request: SessionMessage
}

scoketApp.on('connection', (socket:SessionSocket)=>{
    const session = socket.request.session;

    console.log(`user ${session.id} connected!`);

    socket.on('disconnect', () => {
        console.log(`user ${session.id} disconnected!`);
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        scoketApp.emit('chat message', msg);
    });
});

httpServer.listen(3000, ()=>{
    console.log("Server is running!");
});
