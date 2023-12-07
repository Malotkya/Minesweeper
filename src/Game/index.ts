import { Socket } from "socket.io";
import { IncomingMessage } from "http";
import { SessionData } from "express-session";

import Board, {Tile, Game_Settings, Board_State} from "./Board";
export {Game_Settings};

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
                socket.send("Update", session.board.getState());
                session.save();
            } catch (e){
                socket.send("Error", e);
            }
            
        });
    });

    socket.on("Click", (message:User_Interaction)=>{
        if(session.board === undefined)
                socket.send("Error", new Error("Game is not initiated!"));

        session.reload((err: any)=>{
            if(err){
                console.error(err);
                return socket.disconnect();
            }

            try {
                if(message.type === "flag") {
                    session.board.flag(message.location);
                } else {
                    session.board.click(message.location)
                }
        
                socket.send("Update", session.board.getState())
                session.save();
        
            } catch (e){
                socket.send("Error", e);
            }
               
        });
    });
}