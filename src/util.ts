import { serialize } from "cookie";

export const ONE_DAY = 86400;//s

export class ErrorResponse extends Response {
    constructor(status:number, message:string) {
        super(JSON.stringify({status, message}), {
            status,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}

export class GameResponse extends Response {
    constructor(state:Minesweeper.State) {
        super(JSON.stringify(state), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": serialize("game", state.id, {maxAge: ONE_DAY})
            }
        })
    }
}