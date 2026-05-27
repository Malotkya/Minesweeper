window.onload = () => {
    history.replaceState(history.state, "", "/");
    const main = document.querySelector("main");
    if(!main)
        alert("No main found!");
    else
        main.append("Hello World!");
}