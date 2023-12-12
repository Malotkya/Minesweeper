import { Tile } from "../../util/GameData";

export default class TileButton extends HTMLElement {
    private _child: HTMLParagraphElement|HTMLButtonElement;

    constructor(value: Tile){
        super();

        if(value === Tile.BOMB){
            this._child = document.createElement("p");
            this._child.textContent = "*";

        } else if(value === Tile.FLAG){
            this._child = document.createElement("button");
            this._child.textContent = "F";

        } else if(value > 0){
            this._child = document.createElement("p");
            this._child.textContent = String(value);

        } else {
            this._child = document.createElement("button");
        }
    }

    connectedCallback(){
        this.appendChild(this._child);
    }
}

customElements.define("tile-button", TileButton);