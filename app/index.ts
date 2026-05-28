import { MinesweeperGame } from "./Elements";
import { apiFetch } from "./Elements/util";

const game = new MinesweeperGame();

apiFetch("load").then((resp)=>{
    if(resp instanceof Error)
        return;
    game.init(resp);
});

window.onload = () => {
    history.replaceState(history.state, "", "/");
    document.body.appendChild(game);
}