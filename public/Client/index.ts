import { Socket } from "socket.io-client";
import {Board_State} from "../../util/GameData";;
import TileButton from "./TileButton";

function createNumberInput(att:any = {}): HTMLInputElement {
    const element = document.createElement("input");

    element.type = "number";
    element.addEventListener("input", ()=>{
        if(isNaN(Number(element.value)))
            element.value = "0";
    });

    for(let name in att){
        element.setAttribute(name, String(att[name]));
    }

    return element;
}

export default class Client extends HTMLElement {
    private _btnNewGame: HTMLButtonElement;
    private _numWidth: HTMLInputElement;
    private _numHeight: HTMLInputElement;
    private _numCount: HTMLInputElement;

    private _board: HTMLElement;

    constructor(s: Socket){
        super();

        this._btnNewGame = document.createElement("button");
        this._btnNewGame.addEventListener("click", ()=>{
            s.emit("Reset", {
                width:  Number(this._numWidth.value),
                height: Number(this._numHeight.value),
                count:  Number(this._numCount.value)
            });
        });

        this._numWidth  = createNumberInput({id:"numWidth"});
        this._numWidth.value = "20";
        this._numHeight = createNumberInput({id:"numHeight"});
        this._numHeight.value = "20";
        this._numCount  = createNumberInput({id:"numCount"});
        this._numCount.value = "5";

        this._board = document.createElement("div");
        this._board.style.display = "flex";
        this._board.style.flexDirection = "column";

        s.on("Update", (state:Board_State)=>this.update(state, s));
    }

    update(state:Board_State, socket: Socket){
        this._board.innerHTML = "";

        for(let y=0; y<state.board.length; y++){
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.flexDirection = "row";

            for(let x=0; x<state.board[y].length; x++){
                const tile = new TileButton(state.board[y][x]);
                tile.addEventListener("click", (e)=>{
                    let rightClick:boolean = false;

                    if (e.which) {  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                        rightClick = e.which === 3; 
                    } else {   // IE, Opera 
                        rightClick = (e as any).button === 2;
                    }

                    socket.emit("Click", {
                        type: rightClick? "flag" : "click",
                        location: {
                            x:x,
                            y:y
                        }
                    });

                });

                row.appendChild(tile);
            }

            this._board.appendChild(row);
        }
    }

    connectedCallback(){
        this.appendChild(this._numCount);
        this.appendChild(this._numHeight);
        this.appendChild(this._numWidth);
        this.appendChild(this._btnNewGame);
        this.appendChild(this._board);
    }
}

customElements.define("minesweeper-client", Client);