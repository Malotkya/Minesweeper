import { MinesweeperGame } from "./Elements";
import { apiFetch } from "./Elements/util";

const game = new MinesweeperGame();

apiFetch("load", game.data).then((resp)=>{
    if(resp instanceof Error) 
        return alert(resp.message);

    game.init(resp);
}).catch(console.error);

window.onload = () => {
    history.replaceState(history.state, "", "/");
    document.body.appendChild(game);
}