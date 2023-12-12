export enum Tile {
    FLAG = -3,
    BOMB = -2,
    UNKNOWN = -1,

    EMPTY = 0,

    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    SEVEN = 7,
    EIGHT = 8
}

export interface Game_Settings {
    width: number,
    height: number,
    count: number
}

export interface Board_State {
    board: Array<Array<Tile>>,
    state: "Lossed"|"Won"|"Running",
}