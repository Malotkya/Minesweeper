import {createElement as _, Pattern, renderPattern} from "./util";

export class GameBoard extends HTMLElement {
    #board:GameTile[][] = [];
    #id:string|undefined;

    constructor() {
        super();
        this.addEventListener("click", (event)=>{
            const target:HTMLButtonElement|null = event.target as any;
            if(!target || target.tagName !== "BUTTON")
                return;

            const tile:GameTile|null = target.closest("tile");
            if(tile) {
                event.preventDefault();
                event.stopPropagation();
                this.dispatchEvent(new CustomEvent("input", {
                    detail: tile.pos,
                    bubbles: true
                }));
            }
        })
    }

    validate(mines:number):number {
        let count:number = 0;

        for(const row of this.#board) {
            for(const tile of row) {
                if(tile.value === "X")
                    return -1;

                if(tile.unknown)
                    count += 1;
            }
        }

        return count - mines;
    }
    
    set({id, width, height, board}:Minesweeper.State) {
        this.#id = id;
        this.#board = [];
        height = Math.min(board.length, height);
        width = Math.min(width, ...board.map(r=>r.length));


        for(let y=0; y<height; ++y) {
            const row:GameTile[] = []
            for(let x=0; x<width; ++x)
                row.push(new GameTile(x, y))
            
            this.#board.push(row);
        }

        this.connectedCallback();
    }

    update(state:Minesweeper.State) {
        if(typeof this.#id !== "string")
            return this.set(state);
        

        if(this.#id !== state.id)
            throw new Error("ID mismatch!");

        const {width, height, board} = state;
        for(let y=0; y<height; ++y) {
            const row = this.#board[y];
            if(!row)
                break;

            const update = board[y]
            for(let x=0; x<width; ++x) {
                const tile = row[x];
                if(!tile)
                    break;

                tile.value = update[x];
            }
        }
    }

    connectedCallback() {
        if(this.#id === undefined)
            return;

        this.innerHTML = "";
        
        for(const row of this.#board) {
            const elm = _("div", {class: "row"});

            for(const tile of row) {
                elm.appendChild(tile);
            }

            this.appendChild(elm);
        }
    }
}

customElements.define("game-board", GameBoard);

const MINE:Pattern = [
    [[ 3, 29], [16]],
    [[ 4, 28], [15, 17]],
    [[ 5, 27], [15, 17]],
    [[ 6, 26], [15, 17]],
    [[ 7, 25], [[7, 9], 15, 17, [23, 25]]],
    [[ 8, 24], [7, 9, 10, [14, 18], 22, 23, 25]],
    [[ 9, 23], [7, 8, [10, 22], 24, 25]],
    [[10, 22], [8, 9, [11, 13], [19, 21], 23, 24]],
    [[11, 21], [[9, 11], [21, 23]]],
    [
        [12, 13, 19, 20],
        [9, 10, 16, 22, 23]
    ],
    [[14, 18], [8, 9, 16, 23, 24]],
    [[15, 17], [[4, 9], [14, 17], [23, 28]]],
    [16, [3, 4, 9, 10, [12, 15], [17, 20], 23, 24, 28, 29]]
];
const FLAG:Pattern = [
    [[[2, 30]], [24, 25]],
    [3,   [22, 23] ],
    [4,   [20, 21] ],
    [5,   [18, 19] ],
    [6,   [16, 17] ],
    [7,   [14, 15] ],
    [8,   [12, 13] ],
    [9,   [10, 11] ],
    [10,  [ 8,  9] ],
    [11,  [ 6,  7] ],
    [12, [[ 7, 10]]],
    [13, [[11, 13]]],
    [14, [[14, 16]]],
    [15, [[17, 19]]],
    [16, [[20, 22]]],
    [17, [23]],
];
const MARK:Pattern = [
    [2, [ [13, 18] ]],
    [3, [ [12, 20] ]],
    [4, [ [11, 21] ]],
    [5, [ [10, 12], [19, 22] ]],
    [6, [ [10, 12], [20, 22] ]],
    [[7,  8], [ [9, 11], [21, 23] ]],
    [[9, 10], [ [21, 23] ]],
    [11, [ [20, 22] ]],
    [12, [ [19, 22] ]],
    [13, [ [18, 21] ]],
    [14, [ [16, 20] ]],
    [15, [ [15, 18] ]],
    [
        [ [15, 22], [25, 27] ],
        [ [15, 17] ]
    ]
];

export class GameTile extends HTMLElement {
    #value: Minesweeper.Tile;
    #flagged:boolean|undefined;

    readonly pos:{x:number, y:number};

    constructor(x:number, y:number) {
        super();
        this.#value = -1;
        this.pos = {x, y};
    }

    get unknown():boolean {
        return typeof this.#value === "number" && this.#value < 0;
    }

    get flagged():boolean|undefined {
        return this.#flagged;
    }

    set flagged(value:boolean|undefined) {
        this.#flagged = value;
        this.connectedCallback();
    }

    get value():Minesweeper.Tile {
        return this.#value;
    }

    set value(value:Minesweeper.Tile) {
        this.#value = value;
        if(typeof value === "number" && value >= 0)
            this.#flagged = undefined;

        this.connectedCallback();
    }

    connectedCallback() {
        this.innerHTML = "";
        if(typeof this.#value === "string"){
            this.appendChild(
                renderPattern(MINE, {viewBox: 32, fillColor: "black", bgColor: "red"})
            );
        } else if(this.#value < 0) {
            switch(this.#flagged) {
                case true:
                    this.appendChild(
                        renderPattern(FLAG, {viewBox: 32, fillColor: "black"})
                    );
                    break;

                case false:
                    this.appendChild(
                        renderPattern(MARK, {viewBox: 32, fillColor: "black"})
                    );
                    break;

                default:
                    this.appendChild(_("button"))
            }
        } else if(this.#value > 8) {
            this.appendChild(
                renderPattern(MINE, {viewBox: 32, fillColor: "black"})
            );
        } else {
            this.append(String(this.#value))
        }
        
    }
}

customElements.define("game-tile", GameTile);