import {createElement as _, appendContent} from "./util";

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

export class GameCreater extends HTMLElement {
    #width  = _("input", {type: "number", id:"numWidth"});
    #height = _("input", {type: "number", id:"numHeight"});
    #count  = _("input", {type: "number", id:"numCount"});
    #history:Record<string, string> = {};

    constructor() {
        super();

        this.addEventListener("keydown", (event)=>{
            const target:HTMLInputElement|null = event.target as any;
            if(!target || target.tagName !== "INPUT")
                return;

            this.#history[target.id] = s(target.value);
        });

        this.addEventListener("input", (event)=>{
            const target:HTMLInputElement|null = event.target as any;
            if(!target || target.tagName !== "INPUT")
                return;

            if(isNaN(target.value as any)) {
                target.value = this.#history[target.id];
            }
        });
    }

    updateButton(score:number){
        console.log("TODO!");
    }
    
    get width():number {
        return n(this.#width.value)
    }

    set width(value:number) {
        this.#width.value = s(value);
    }

    get height():number {
        return n(this.#height.value)
    }

    set height(value:number) {
        this.#height.value = s(value);
    }

    get count():number {
        return n(this.#count.value)
    }

    set count(value:number) {
        this.#count.value = s(value);
    }

    connectedCallback(){
        this.innerHTML = "";

        const btnSubmit = _("button", "New Game");
        btnSubmit.addEventListener("click", ()=>{
            this.dispatchEvent(new CustomEvent("submit", {
                bubbles: true
            }));
        });

        appendContent(this, [
            _("label", {for: "numWidth"},  "Game Width:"),  this.#width,
            _("label", {for: "numHeight"}, "Game Height:"), this.#height,
            _("label", {for: "numCount"},  "Mine Count:"),  this.#count,
            _("div", {class: "btns"}, btnSubmit)
        ]);
    }
}

customElements.define("game-creater", GameCreater)