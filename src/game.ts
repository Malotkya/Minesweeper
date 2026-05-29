import { ErrorResponse, ONE_DAY } from "./util";
import { parse } from "cookie";

function generateRow(data:number[]|undefined, width:number):Minesweeper.Tile[] {
    data = data?.sort((a, b) => a - b);
    const output:Minesweeper.Tile[] = [];

    let next = data?.shift();
    let i=0;
    while(typeof next === "number") {
        for(; i<next; ++i)
            output.push(-1);
        
        output.push(9);
        ++i;
        next = data?.shift();
    }

    for(; i<width; ++i)
        output.push(-1);

    return output;
}

function createNewState(width:number, height:number, count:number):Minesweeper.State {
    const mines = count;
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
        data: {
            width, height, mines
        },
        board
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

function g(board:Minesweeper.Tile[][], x:number, y:number):Minesweeper.Tile|undefined {
    const row:Minesweeper.Tile[]|undefined = board[y];
    if(!row)
        return;
    return row[x];
}

function isMine(board:Minesweeper.Tile[][], x:number, y:number):boolean {
    const tile = g(board, x, y);
    if(!tile)
        return false;

    return typeof tile !== "number" || tile > 8;
}

function countAdjacentMines(board:Minesweeper.Tile[][], x:number, y:number):Minesweeper.Tile {
    let count:number = 0;
    if(isMine(board, x-1, y-1))
        count += 1;
    if(isMine(board, x-1, y))
        count += 1;
    if(isMine(board, x-1, y+1))
        count += 1;
    if(isMine(board, x+1, y-1))
        count += 1;
    if(isMine(board, x+1, y))
        count += 1;
    if(isMine(board, x+1, y+1))
        count += 1;
    if(isMine(board, x, y-1))
        count += 1;
    if(isMine(board, x, y+1))
        count += 1;

    return count as Minesweeper.Tile;
}

function travelBoard(board:Minesweeper.Tile[][], x:number, y:number) {
    const tile = g(board, x, y)
    if(isNaN(tile as number) || (tile as number) >= 0)
        return;

    const count = countAdjacentMines(board, x, y);
    board[y][x] = count;

    if(count === 0) {
        travelBoard(board, x-1, y);
        travelBoard(board, x+1, y);
        travelBoard(board, x, y-1);
        travelBoard(board, x, y+1);
    }
}

function handleClick(state:Minesweeper.State, x:number, y:number):Minesweeper.State {
    const tile = state.board[y][x];
    if(tile == 9) {
        state.done = true;
        state.board[y][x] = "X";
        
    } else if(tile === -1) {
        travelBoard(state.board, x, y)
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
        return new ErrorResponse(400, "Missing Game State!");

    const {game} = parse(cookie);
    if(!game)
        return new ErrorResponse(400, "Missing Game State!");

    const storedState = await store.get(game);
    if(!storedState)
        return new ErrorResponse(409, `Unable to find game "${game}"!`);

    try {
        const state:Minesweeper.State = JSON.parse(storedState);
        if(typeof state !== "object")
            throw new TypeError(`Recieved ${typeof state} instead of object!`);

        if(typeof state.id !== "string")
            state.id = game;

        if(typeof state.data !== "object")
            throw new TypeError('Missing game data!');

        if(isNaN(state.data.width))
            throw new TypeError("Width is not a number!");

        if(isNaN(state.data.height))
            throw new TypeError("Height is not a number!");

        if(isNaN(state.data.mines))
            throw new TypeError("Mines is not a number!");

        if(!Array.isArray(state.board))
            throw new TypeError("Board state is not an Array!");

        if(state.board.length !== state.data.height)
            throw new TypeError("Board state does not match height!");

        const width = state.data.width;
        for(const row of state.board) {
            if(!Array.isArray(row))
                throw new TypeError("Board State row is malformed!");

            if(row.length !== width)
                throw new TypeError("Borad State row does not match width!");
        }

        return state;
    } catch (e) {
        console.error(e);
        return new ErrorResponse(500, `Stored Gamestate was corrupted!`);
    }
}

async function deleteState(cookie:string|null, store:KVNamespace):Promise<void> {
    if(!cookie)
        return;

    const {game} = parse(cookie);
    if(!game)
        return;

    await store.delete(game);
}

function revealBoard(board:Minesweeper.Tile[][]) {
    for(let y=0; y<board.length; ++y) {
        const row = board[y];

        for(let x=0; x<row.length; ++x) {
            const v = row[x];
            if(typeof v === "number" && v <= 0)
                row[x] = countAdjacentMines(board, x, y);
        }
    }
}

export function convertBoardState(state:Minesweeper.State) {
    let concealed:Minesweeper.Tile[][];
    if(!state.done) {
        let count:number = 0;
        concealed = state.board.map((row)=>row.map(tile=>{
            if(typeof tile === "string" || tile < 0) {
                ++count;
            } else if(tile > 8) {
                return -1;
            }
            return tile;
        }));
        
        state.done = count <= state.data.mines;
    }

    if(state.done) {
        revealBoard(state.board);
    } else {
        state.board = concealed!;
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
            if(isNaN(count) || count < 0 || count > (width*height))
                return new ErrorResponse(400, "Invalid count!");

            await deleteState(cookie, store);
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
            if(isNaN(x) || (x < 0 || x >= data.data.width))
                return new ErrorResponse(400, "Invalid X pos!");

            if(isNaN(y) || (y < 0 || y >= data.data.height))
                return new ErrorResponse(400, "Invalid X pos!");

            state = handleClick(data, x, y);
            break;
        }


        case "load": {
            const data = await getState(cookie, store);
            if(data instanceof Response) {
                if(value) 
                    return handleAction({action: "new", value}, null, store);

            }

            return data;
        }

        default:
            return new ErrorResponse(400, `Invalid action "${action}"`);
    }

    
    await store.put(state.id, JSON.stringify(state), {expirationTtl:ONE_DAY});

    return state;
}