import { apiFetch, createElement as _, appendContent } from "./util";
import {GameBoard} from "./Board";
import {GameCreater} from "./Creater";

export class MinesweeperGame extends HTMLElement {
    #form:GameCreater = new GameCreater();
    #board:GameBoard = new GameBoard();
    #wheel:HTMLElement = _("p", "waiting...");
    #count:number = 0;

    constructor() {
        super();

        this.#board.addEventListener("input", async(event:CustomEventInit<{x:number, y:number}>)=>{
            if(typeof event.detail === "object") {
                this.locked = true;
                const resp = await apiFetch("click", event.detail);
                this.locked = false;

                if(resp instanceof Error) {
                    console.error(resp);
                    alert(resp.message);
                } else {
                    this.#board.update(resp);
                    this.#board.validate(this.#form.count)
                }
            }
        });

        this.#form.addEventListener("submit", async()=>{
            this.#count = this.#form.count;
            this.locked = true;
            const resp = await apiFetch("new", {
                width: this.#form.width,
                height: this.#form.height,
                count: this.#form.count
            });
            this.locked = false;

            if(resp instanceof Error) {
                console.error(resp);
                alert(resp.message);
            } else {
                this.#board.set(resp);
                if(resp.done) {
                    this.#form.updateButton(
                        this.#board.validate(this.#count)
                    );
                }
            }
        })
    }

    init(state:Minesweeper.State) {
        this.#count = 0;
        this.#board.set(state);
    }

    get locked():boolean {
        return this.#wheel.hidden as boolean;
    }

    set locked(value:boolean) {
        this.#wheel.hidden = value;
        this.#wheel.style.display = value? "hidden": "";
    }

    disconnectedCallback() {
        this.innerHTML = "";
    }

    connectedCallback() {
        appendContent(this, [
            
        ])
    }
}

customElements.define("mine-sweeper", MinesweeperGame);