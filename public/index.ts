import { io } from "socket.io-client";

window.onload = () => {
    const socket = io();

    const form = document.getElementById('form');
    const input: HTMLInputElement = document.getElementById('input') as HTMLInputElement;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {
            socket.emit('chat message', input.value);
            input.value = '';
        }
    });

    const messages = document.getElementById('messages');
    socket.on('chat message', (msg) => {
        const item = document.createElement('li');
        item.textContent = msg;
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });
}