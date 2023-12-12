import { Socket } from "socket.io";
import { IncomingMessage } from "http";
import { SessionData } from "express-session";

import Board from "./Board";
import { Game_Settings } from "../../util/GameData";

interface GameSessionData extends SessionData{
    id: string
    board?: Board,
    reload: (e:any)=>void;
    save:()=>void;
}

interface SessionMessage extends IncomingMessage {
    session: GameSessionData
}

interface SessionSocket extends Socket {
    request: SessionMessage
}

export interface User_Interaction {
    type: string,
    location: {x:number, y: number},
}

export default function Game(socket:SessionSocket){
    const session = socket.request.session;

    console.log(`user ${session.id} connected!`);

    socket.on('disconnect', () => {
        console.log(`user ${session.id} disconnected!`);
    });

    socket.on("Reset", (message:Game_Settings) => {

        session.reload((err: any)=>{
            if(err){
                console.error(err);
                return socket.disconnect();
            }

            try {
                session.board = new Board(message);
                socket.emit("Update", session.board.getState());
                console.log(`user ${session.id} created a new Game!`);
                session.save();
            } catch (e){
                console.error(e);
                socket.emit("Error", e);
            }
            
        });
    });

    socket.on("Click", (message:User_Interaction)=>{
        if(session.board === undefined)
                socket.emit("Error", new Error("Game is not initiated!"));

        session.reload((err: any)=>{
            if(err){
                console.error(err);
                return socket.disconnect();
            }

            try {
                if(message.type === "flag") {
                    session.board.flag(message.location);
                    console.log(`User ${session.id} flagged Button[${message.location.x},${message.location.y}]!`);
                } else {
                    session.board.click(message.location);
                    console.log(`User ${session.id} clicked Button[${message.location.x},${message.location.y}]!`);
                }
        
                socket.emit("Update", session.board.getState())
                session.save();
        
            } catch (e){
                console.error(e);
                socket.emit("Error", e);
            }
               
        });
    });
}