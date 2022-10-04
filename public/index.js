let socket = io();

let reconnect = false
let token
let user
let scale

let gap = "\n         "

let elements = {
    "container": document.querySelector("div.container"),
    "canvas": document.querySelector("canvas.canvas")
}

let canvas = elements.canvas.getContext("2d")
let pixels = []

let setScale = (newScale) => {
    scale = newScale
    elements.container.style.transform = `scale(${newScale})`
}

let setColour = (colour) => {
    socket.emit("colour", {colour: colour})
    localStorage.setItem("colour", colour)
}

socket.on("connect", () => {
    console.log(`%c[INFO] %cSocket Connected:${gap}%cID: %c${socket.id}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;")
    if (reconnect) return window.location.reload()
    reconnect = true
    socket.emit("token", {
        token: localStorage.getItem("token")
    })
})

socket.on("token", (data) => {
    console.log(`%c[INFO] %cReceived Token:${gap}%cTOKEN: %c${data.token}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;")
    localStorage.setItem("token", data.token)
    token = data.token
    socket.emit("request")

    let localName = localStorage.getItem("name")
    let localColour = localStorage.getItem("colour")

    if(localName) socket.emit("name", {name: localName})
    if(localColour) socket.emit("colour", {colour: localColour})
    socket.emit("user")
})

socket.on("request", (data) => {
    console.log(`%c[INFO] %cReceived Board:${gap}%cWIDTH: %c${data.width}${gap}%cHEIGHT: %c${data.height}${gap}%cSCALE: %c${data.scale}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;")
    elements.container.style.display = "flex"
    elements.canvas.width = data.width
    elements.canvas.height = data.height


    canvas.fillStyle = "#000000"

    pixels = data.data
    setScale(data.scale)

    pixels.forEach((pixel) => {
        canvas.fillStyle = pixel.colour
        canvas.fillRect(pixel.x, pixel.y, 1, 1)
    })
    elements.canvas.addEventListener("click", (event) => {
        let bounds = elements.canvas.getBoundingClientRect()
        socket.emit("draw", {
            x: Math.floor((event.clientX - bounds.x) / scale),
            y: Math.floor((event.clientY - bounds.y) / scale),
            colour: canvas.fillStyle
        })
    })

})

socket.on("draw", (data) => {
    console.log(`%c[INFO] %cReceived Pixel:${gap}%cX: %c${data.x}${gap}%cY: %c${data.y}${gap}%cCOLOUR: %c${data.colour}${gap}%cNAME: %c${data.name}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;")
    canvas.fillStyle = data.colour
    canvas.fillRect(data.x, data.y, 1, 1)
})

socket.on("user", (data) => {
    user = data

    console.log(`%c[INFO] %cReceived User:${gap}%cCOOLDOWN: %c${user.cooldown}${gap}%cNAME: %c${user.name || localName}${gap}%cCOLOUR: %c${data.colour}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;")
})

let errors = {
    "1": "No user",
    "2": "No name",
    "3": "On cooldown ({cooldown}ms)",
    "4": "Invalid pixel data",
    "5": "Invalid position",
    "6": "Invalid colour",
    "7": "Out of bounds"
}

socket.on("error", (error) => {
    console.log(`%c[INFO] %c${errors[error.code].replace("{cooldown}", error.cooldown)}`, "color:cornflowerblue;font-weight:bold;", "")
})

document.addEventListener("keypress", (event) => {
    if (event.code === "Equal") {
        setScale(Math.min(scale + 0.25, 7.5))
    } else if (event.code === "Minus") {
        setScale(Math.max(scale - 0.25, 0.25))
    }
})

socket.on("online", (data) => {
    console.log(`%c[INFO] %cReceived Online:${gap}%cAMOUNT: %c${data.online}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;")
})