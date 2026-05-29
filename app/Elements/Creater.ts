import {createElement as _, appendContent} from "./util";

const MAX_TILE_SIZE = 20;//px

function n(value:any):number {
    value = Number(value);
    if(isNaN(value))
        return 0;
    return value;
}

function s(value:any):string {
    if(isNaN(value))
        return "";
    return String(value);
}

const STORE_KEY = "minesweeper.settings";

export class GameCreater extends HTMLElement {
    #width  = _("input", {type: "number", id:"numWidth"});
    #height = _("input", {type: "number", id:"numHeight"});
    #count  = _("input", {type: "number", id:"numCount"});
    #select = _("select", {id:"gameMode"},
        _("option", {value: JSON.stringify({width:9,  height: 9,  mines:10})}, "Beginner"),
        _("option", {value: JSON.stringify({width:16, height: 16, mines:40})}, "Intermediate"),
        _("option", {value: JSON.stringify({width:16, height: 30, mines:99})}, "Expert"),
        _("option", {value: ""}, "Custom"),
    )
    #button = _("button", "New Game");
    #history:Record<string, string> = {};
    #maxWidth:number;
    #maxHeight:number;

    constructor() {
        super();

        this.addEventListener("keydown", (event)=>{
            const target:HTMLInputElement|null = event.target as any;
            if(!target || target.tagName !== "INPUT")
                return;

            this.#history[target.id] = s(target.value);
        });

        this.addEventListener("input", (event)=>{
            const target:HTMLInputElement|HTMLSelectElement|null = event.target as any;
            if(!target)
                return;

            switch(target.tagName) {
                case "INPUT":
                    if(isNaN(target.value as any))
                        target.value = this.#history[target.id];

                    this.__validate();
                    break;

                case "SELECT":
                    this.__updateInputs();
                    
            }
        });

        this.#button.addEventListener("click", ()=>{
            this.dispatchEvent(new CustomEvent("submit", {
                bubbles: true
            }));
        });

        const cache = localStorage.getItem(STORE_KEY);
        if(cache)
            this.#select.value = cache;
        this.__updateInputs();
        this.#maxHeight = this.height;
        this.#maxWidth = this.width;
    }

    private __updateInputs() {
        const value = this.#select.value;
        try {
            localStorage.setItem(STORE_KEY, value)
            if(!value)
                throw null;
            
            const data:Minesweeper.State["data"] = JSON.parse(this.#select.value);
            if(typeof data.width !== "number")
                throw new TypeError("Width must be a number!");
            this.width = data.width;
            this.#width.disabled = true;

            if(typeof data.height !== "number")
                throw new TypeError("Height must be a number!");
            this.height = data.height;
            this.#height.disabled = true;

            if(typeof data.mines !== "number")
                throw new TypeError("Mine Count must be a number!");
            this.count = data.mines;
            this.#count.disabled = true;
        } catch (e) {
            if(e)
                console.error(e);

            this.#width.disabled = false;
            this.#height.disabled = false;
            this.#count.disabled = false;
        }
    }

    private __validate() {
        this.width = this.width;
        this.height = this.height;
        this.count = this.count;
    }

    init(maxHeight:number, maxWidth:number) {
        this.#maxHeight = Math.floor(maxHeight / MAX_TILE_SIZE);
        this.#maxWidth = Math.floor(maxWidth / MAX_TILE_SIZE);
        this.__validate();
    }

    updateButton(score:number){
        console.log("TODO!");
    }
    
    get width():number {
        return n(this.#width.value)
    }

    set width(value:number) {
        if(isNaN(value) || value < 0) {
            value = 0;
        } else if(value < 0) {
            value 
        }
        this.#width.value
            = this.#history["numWidth"]
            = s(value);
    }

    get height():number {
        return n(this.#height.value)
    }

    set height(value:number) {
        this.#height.value
            = this.#history["numHeight"]
            = s(value);
    }

    get count():number {
        return n(this.#count.value)
    }

    set count(value:number) {
        this.#count.value
            = this.#history["numCount"]
            = s(value);
    }

    connectedCallback(){
        this.innerHTML = "";

        appendContent(this, [
            _("div", {class: "row header"}, this.#button, this.#select),
            _("div", {class: "row input"},
                _("div", {class:"row"},
                    _("label", {for: "numWidth"},  "Game Width:"),  this.#width
                ),
                _("div", {class:"row"},
                    _("label", {for: "numHeight"}, "Game Height:"), this.#height
                ),
                _("div", {class:"row"},
                    _("label", {for: "numCount"},  "Mine Count:"),  this.#count
                )
            )
        ]);
    }
}

customElements.define("game-header", GameCreater)