import { Socket } from "socket.io";
import { IncomingMessage } from "http";
import { SessionData } from "express-session";

interface GameSessionData extends SessionData{
    id: string
}

interface SessionMessage extends IncomingMessage {
    session: GameSessionData
}

interface SessionSocket extends Socket {
    request: SessionMessage
}

export default function Game(socket:SessionSocket){
    const session = socket.request.session;

    console.log(`user ${session.id} connected!`);

    socket.on('disconnect', () => {
        console.log(`user ${session.id} disconnected!`);
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        socket.emit('chat message', msg);
    });
}