namespace Minesweeper {
    /** Tile:
     *  -1 = Unselected
     *   9 = Mine
     * 0-8 = Adjacent mines
     */
    export type Tile = -1|0|1|2|3|4|5|6|7|8|9|"X";
    export type State = {
        id: string;
        done?:boolean;
        data: {
            mines:number;
            width:number;
            height:number;
        };
        board: Tile[][];
    };

    export type Action = {
        action: "new",
        value: {
            width:number,
            height:number,
            count:number
        }
    } | {
        action: "reset",
        value: undefined
    } | {
        action: "click",
        value: {
            x:number,
            y:number
        };
    } | {
        action: "load",
        value: undefined
    }
}

interface ENV {
    ASSETS: Fetcher,
    KV: KVNamespace
}