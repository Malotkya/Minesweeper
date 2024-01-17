import {Tile, Game_Settings, Board_State} from "../../util/GameData";

export type Board_Map = Array<Array<Tile>>;
export type Board_Mask = Array<Array<Tile.FLAG|Tile.UNKNOWN|undefined>>
type Location = {x:number, y:number};

export default class Board {
    private _state: Board_Map;
    private _cover: Board_Mask;
    private _width: number;
    private _height: number;
    private _count: number
    private _explode: boolean;

    constructor(s:Game_Settings){

        if(typeof s.height !== "number")
            throw new TypeError("Width must be a number!");

        this._height = s.height;

        this._state = [];
        this._cover = [];

        for(let i=0; i<s.height; i++){
            this._state[i] = [];
            this._cover[i] = [];
        }

        if(typeof s.width !== "number")
            throw new TypeError("Height must be a number!");

        this._width = s.width;

        if(typeof s.count !== "number")
            throw new TypeError("Count must be a number!");

        this._count = 0;
        while(this._count < s.count){
            const y = Math.floor(Math.random() * this._height);
            const x = Math.floor(Math.random() * this._width);

            if(this._state[y][x] === undefined){
                this._state[y][x] = Tile.BOMB;
                this._count++;
            }
        }

        for(let y=0; y<this._height; y++){
            for(let x=0; x<this._width; x++){
                if( this._state[y][x] === undefined){
                    this._state[y][x] = Number(this.count(y-1, x-1)) + Number(this.count(y-1, x)) + Number(this.count(y-1, x+1))
                                      + Number(this.count(y  , x-1))                              + Number(this.count(y  , x+1))
                                      + Number(this.count(y+1, x-1)) + Number(this.count(y+1, x)) + Number(this.count(y+1, x+1));
                }

                this._cover[y][x] = Tile.UNKNOWN;
            }
        }
    }

    private cover(y:number, x:number): boolean {
        return (this._cover[y][x]) !== undefined;
    }

    private count(y:number, x:number): number {
        if(y < 0 || y >= this._height)
            return 0;

        if(x < 0 || x >= this._width)
            return 0;

        return Number(this._state[y][x] === Tile.BOMB);
    }

    private getBoard(): Board_Map{
        const output: Board_Map = [];

        for(let y=0; y<this._height; y++){
            output[y] = [];
            let debug: string = "";

            for(let x=0; x<this._width; x++){
                if( this.cover(y,x) ){
                    output[y][x] = this._cover[y][x];
                    debug += this._cover[y][x] + " ";
                } else {
                    output[y][x] = this._state[y][x];
                    debug += this._state[y][x] + " ";
                }
            }

            console.log(debug);
        }

        return output;
    }

    private getString(): "Lossed"|"Won"|"Running"{
        if(this._explode)
            return "Lossed";

        let correct: number = 0;
        for(let y=0; y<this._height; y++){
            for(let x=0; x<this._width; x++){

                if(this._cover[y][x] === Tile.FLAG && this._state[y][x] === Tile.BOMB)
                    correct++;
            }
        }

        if(correct === this._count)
            return "Won";

        return "Running";
    }

    public getState():Board_State {
        console.log("Getting State!")
        return {
            state: this.getString(),
            board: this.getBoard()
        }
    }

    private validate(l:Location): void{
        if(this._explode)
            throw new Error("Game is over!");

        if( typeof l.y !== "number")
            throw new TypeError("Position 'y' must be a number");

        if( typeof l.x !== "number")
            throw new TypeError("Position 'x' must be a number");

        if( l.x < 0 || l.x >= this._width)
            throw new Error("'x' is out of bounds!");

        if( l.y < 0 || l.y >= this._height)
            throw new Error("'y' is out of bounds!");
    }

    public click(l:Location): void {
        this.validate(l);
        this._explode = this._state[l.y][l.x] === Tile.BOMB;
        this.updateMask(l.y, l.x);
    }

    public flag(l:Location): void {
        this.validate(l);
        if( !this.cover(l.y,l.x) )
            throw new Error("Illegal Move: Unable to Flag Uncovered Tile!");

        if(this._state[l.y][l.x] === Tile.FLAG){
            this._state[l.y][l.x] === Tile.EMPTY;
        } else {
            this._state[l.y][l.x] === Tile.FLAG;
        }
    }

    private updateMask(y:number, x:number): void {
        //If out of bounds: Stop
        if( (y < 0 && y >= this._height) && (x < 0 && x >= this._width) )
            return;

        //If already uncovered: Stop
        if( !this.cover(y,x) )
            return;

        //Uncover
        this._cover[y][x] = undefined;

        //If Empty Tile: Keep Going
        if( this._state[y][x] === Tile.EMPTY ){
            this.updateMask(y-1, x);
            this.updateMask(y+1, x);
            this.updateMask(y, x-1);
            this.updateMask(y, x+1);
        }
    }
}