import { ErrorResponse, ONE_DAY } from "./util";
import { parse } from "cookie";

function generateRow(data:number[]|undefined, width:number):Minesweeper.Tile[] {
    data = data?.sort();
    const output:Minesweeper.Tile[] = [];

    let next = data?.shift();
    let i=0;
    while(typeof next === "number") {
        for(; i<next; ++i)
            output.push(-1);
        
        output.push(9);
        next = data?.shift();
    }

    for(; i<width; ++i)
        output.push(-1);

    return output;
}

function createNewState(width:number, height:number, count:number):Minesweeper.State {
    const map:Record<number, number[]|undefined> = {};
    const pushValidPos = (x:number, y:number):boolean => {
        let row = map[y];
        if(row === void 0)
            row = map[y] = [];            
        

        if(row.includes(x))
            return false;

        row.push(x);
        return true;
    }

    const array = new Uint32Array(2);
    while(count > 0) {
        crypto.getRandomValues(array);

        const x = array[0] % width;
        const y = array[1] % height;

        if(pushValidPos(x, y))
            --count;
    }

    const board:Minesweeper.Tile[][] = [];
    for(let i=0; i<height; i++)
        board.push(generateRow(map[i]?.sort(), width))
    
    return {
        id: crypto.randomUUID(),
        width, height, board
    }
}

function resetState(state:Minesweeper.State):Minesweeper.State {
    state.board = state.board.map(row=>row.map(tile=>{
        if(tile != 9 && tile != "X")
            return -1
        return 9;
    }));

    return state;
}

function travelBoard(board:Minesweeper.Tile[][], x:number, y:number) {
    const tile = board[y][x];
    if(tile != -1)
        return;

    let count:number = 0;
    if(board[y-1][x-1] == 9){
        count +=1;
    } else if(board[y-1][x] == 9){
        count +=1;
    } else if(board[y-1][x+1] == 9){
        count +=1;
    } else if(board[y+1][x-1] == 9){
        count +=1;
    } else if(board[y+1][x] == 9){
        count +=1;
    } else if(board[y+1][x+1] == 9){
        count +=1;
    } else if(board[y][x-1] == 9){
        count +=1;
    } else if(board[y][x+1] == 9){
        count +=1;
    }
    
    if(count === 0) {
        travelBoard(board, x-1, y);
        travelBoard(board, x+1, y);
        travelBoard(board, x, y-1);
        travelBoard(board, x, y+1);
    } else {
        board[y][x] = count as Minesweeper.Tile;
    }
}

function handleClick(state:Minesweeper.State, x:number, y:number):Minesweeper.State {
    const tile = state.board[y][x];
    if(tile == 9) {
        state.done = true;
        state.board[y][x] = "X";
        
    } else if(tile === -1) {
        travelBoard(state.board, x-1, y);
        travelBoard(state.board, x+1, y);
        travelBoard(state.board, x, y-1);
        travelBoard(state.board, x, y+1);
    }

    return state;
}

export async function getAction(req:Request):Promise<Minesweeper.Action|ErrorResponse> {
    try {
        const action:Minesweeper.Action = await req.json();
        if(typeof action !== "object" || typeof action.action !== "string" )
            return new ErrorResponse(400, "Invalid Game Action!");

        return action;
    } catch (e){
        return new ErrorResponse(400, "Unable to parse JSON from request!");
    }
}

async function getState(cookie:string|null, store:KVNamespace):Promise<Minesweeper.State|ErrorResponse> {
    if(!cookie)
        return new ErrorResponse(400, "Missing Game State!");;

    const {game} = parse(cookie);
    if(!game)
        return new ErrorResponse(400, "Missing Game State!");;

    const storedState = await store.get(game);
    if(!storedState)
        return new ErrorResponse(409, `Unable to find game "${game}"!`);

    try {
        const state:Minesweeper.State = JSON.parse(storedState);
        if(typeof state !== "object")
            throw new TypeError(`Recieved ${typeof state} instead of object!`);

        if(typeof state.id !== "string")
            state.id = game;

        if(isNaN(state.width))
            throw new TypeError("Width is not a number!");

        if(isNaN(state.height))
            throw new TypeError("Height is not a number!");

        if(!Array.isArray(state.board))
            throw new TypeError("Board state is not an Array!");

        if(state.board.length !== state.height)
            throw new TypeError("Board state does not match height!");

        for(const row of state.board) {
            if(!Array.isArray(row))
                throw new TypeError("Board State row is malformed!");

            if(row.length !== state.width)
                throw new TypeError("Borad State row does not match width!");

            for(const tile of row) {
                if(isNaN(tile as number))
                    throw new TypeError("Board State tile is invalid!");
            }
        }

        return state;
    } catch (e) {
        console.error(e);
        return new ErrorResponse(500, `Stored Gamestate was corrupted!`);
    }
}

export async function handleAction({action, value}:Minesweeper.Action, cookie:string|null, store:KVNamespace):Promise<ErrorResponse|Minesweeper.State> {
    let state:Minesweeper.State;
    switch (action) {
        case "new": {
            const {width, height, count} = value;
            if(isNaN(width))
                return new ErrorResponse(400, "Invalid width!");
            if(isNaN(height))
                return new ErrorResponse(400, "Invalid height!");
            if(isNaN(count) || count < 0)
                return new ErrorResponse(400, "Invalid count!");

            state = createNewState(width, height, count);
            break;
        }
            

        case "reset": {
            const data = await getState(cookie, store);
            if(data instanceof Response)
                return data;

            state = resetState(data);
            break;
        }
            

        case "click": {
            const data = await getState(cookie, store);
            if(data instanceof Response)
                return data;

            const {x, y} = value;
            if(isNaN(x) || (x < 0 || x >= data.width))
                return new ErrorResponse(400, "Invalid X pos!");

            if(isNaN(y) || (y < 0 || y >= data.height))
                return new ErrorResponse(400, "Invalid X pos!");

            state = handleClick(data, x, y);
            break;
        }

        default:
            return new ErrorResponse(400, `Invalid action "${action}"`);
    }

    if(state.done)
        await store.delete(state.id);
    else
        await store.put(state.id, JSON.stringify(state), {expirationTtl:ONE_DAY});

    return state;
}