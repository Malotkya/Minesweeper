import { io } from "socket.io-client";
import {Board_State} from "../util/GameData";;
import Client from "./Client";

const socket = io();

window.onload = () => {
    const c = new Client(socket);
    document.body.appendChild(c);
}

socket.on("Update", (message:Board_State)=>{
    console.log(message);
});

socket.on("Error", (e:any)=>{
    console.error(e);
});