let socket = io();

let reconnect = false
let token
let user
let scale
let defaultScale
let offset = {x:0, y:0}
let ping
let dark
let gap = "\n         "
let mousePos = {x:50, y:50}
let prefix = "/"
let online = 0
let sound = localStorage.getItem("sound") || false
let volume = localStorage.getItem("volume") || 0.15
let lastMessage = ""

let elements = {
    "root": document.querySelector(":root"),
    "container": document.querySelector("div.container"),
    "canvas": document.querySelector("canvas.canvas"),
    "stats": {
        "online": document.querySelector("div.stat#online"),
        "ping": document.querySelector("div.stat#ping"),
        "container": document.querySelector("div.stats")
    },
    "connecting": document.querySelector("div.connecting"),
    "toolbar": {
        "container": document.querySelector("div.toolbar"),
        "zoom": document.querySelector("div.toolbar-button#zoom"),
        "offset": document.querySelector("div.toolbar-button#offset"),
        "controls": document.querySelector("div.toolbar-button#controls"),
        "dark": document.querySelector("div.toolbar-button#dark"),
        "commands": document.querySelector("div.toolbar-button#commands"),
        "input": document.querySelector("input#input"),
        "submit": document.querySelector("div.toolbar-button#submit"),
        "sound": document.querySelector("div.toolbar-button#audio"),
    },
    "chat": document.querySelector("div.chat")
}

let canvas = elements.canvas.getContext("2d")
let pixels = []

let setOffset = (x, y) => {
    offset = {x:x, y:y}
    elements.container.style.transform = `translate(${x}px, ${y - 15}px)`
}

setOffset(0,0)

let setScale = (newScale) => {
    scale = newScale
    elements.canvas.style.transform = `scale(${newScale})`

    // let mouseX = mousePos.x-elements.canvas.clientWidth/2
    // let mouseY = mousePos.y-elements.canvas.clientHeight/2
    //
    // setOffset(-(mouseX*scale), -(mouseY*scale))
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
    elements.connecting.classList.add("fadeout")
    setTimeout(() => {elements.connecting.style.display = "none"}, 400)

    canvas.fillStyle = "#000000"

    pixels = data.data
    setScale(data.scale)
    defaultScale = data.scale

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

let placesound = new Howl({
    src: ["audio/place.ogg"],
    volume: volume
})

socket.on("draw", (data) => {
    console.log(`%c[INFO] %cReceived Pixel:${gap}%cX: %c${data.x}${gap}%cY: %c${data.y}${gap}%cCOLOUR: %c${data.colour}${gap}%cNAME: %c${data.name}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;", "color: gray;font-weight: bold;", "color: yellow;")
    canvas.fillStyle = data.colour
    canvas.fillRect(data.x, data.y, 1, 1)
    if(sound) placesound.play()
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

document.addEventListener("keydown", (event) => {
    if(event.target.nodeName.toLowerCase() === 'input') return
    if (event.code === "Equal") {
        setScale(Math.min(scale + 0.25 * scale / 4, 50))
        if(scale > 49) setScale(50)
    } else if (event.code === "Minus") {
        setScale(Math.max(scale - 0.25 * scale / 4, 0.25))
    } else if(event.code === "ArrowRight" || event.code === "KeyD") {
        setOffset(offset.x - scale - 10, offset.y)
    } else if(event.code === "ArrowUp" || event.code === "KeyW") {
        setOffset(offset.x, offset.y + scale + 10)
    } else if(event.code === "ArrowDown" || event.code === "KeyS") {
        setOffset(offset.x, offset.y - scale - 10)
    } else if(event.code === "ArrowLeft" || event.code === "KeyA") {
        setOffset(offset.x + scale + 10, offset.y)
    }

})

socket.on("online", (data) => {
    console.log(`%c[INFO] %cReceived Online:${gap}%cAMOUNT: %c${data.online}`,"color:cornflowerblue;font-weight:bold;", "", "color: gray;font-weight: bold;", "color: yellow;")
    elements.stats.online.innerHTML = `${data.online} Online`
    online = data.online
})

let setPing = () => {
    const start = Date.now();
    socket.emit("ping", () => {
        ping = Date.now() - start;
        elements.stats.ping.innerHTML = `${ping} Ping`
    });
}

setPing()
setInterval(() => {setPing()}, 1000);

let setDark = (darkmode) => {
    if(darkmode){
        elements.root.style.setProperty("--background", "#333333")
        elements.root.style.setProperty("--button-background", "#2a2a2a")
        elements.root.style.setProperty("--button-colour", "#666666")
        elements.root.style.setProperty("--text", "#666666")
        localStorage.setItem("dark", "on")
        dark = true
    }else{
        elements.root.style.setProperty("--background", "#FFFFFF")
        elements.root.style.setProperty("--button-background", "#dddddd")
        elements.root.style.setProperty("--button-colour", "#999999")
        elements.root.style.setProperty("--text", "#bbbbbb")
        localStorage.removeItem("dark")
        dark = false
    }
}

setDark(localStorage.getItem("dark") === "on")

elements.toolbar.dark.addEventListener("click", () => {
    setDark(!dark)
})

elements.toolbar.zoom.addEventListener("click", () => {
    setScale(defaultScale)
})

elements.toolbar.offset.addEventListener("click", () => {
    setOffset(0,0)
})

elements.toolbar.input.addEventListener("keydown", (event) => {
    if(event.code === "Enter") {
        submit()
    }else if(event.code === "ArrowUp"){
        event.preventDefault()
        elements.toolbar.input.value = lastMessage
    }

})

let setSound = (soundEnabled) => {
    if(soundEnabled){
        sound = true
        localStorage.setItem("sound", "true")
    }else{
        sound = false
        localStorage.removeItem("sound")
    }
}

elements.toolbar.sound.addEventListener("click", () => {
    setSound(!sound)
})

let systemMessage = (content, error) => {
    elements.chat.innerHTML += `<div class="message"><div class="user ${error ? "error" : "system"}">System:</div><div class="content">${content}</div></div>`
}

let sendHelp = () => {
    systemMessage("Help menu")
}

let sendControls = () => {
    systemMessage("Controls")
}

let submit = () => {
    let message = elements.toolbar.input.value
    elements.toolbar.input.value = ""
    if(!message) return

    lastMessage = message

    if(!message.startsWith(prefix)) return socket.emit("message", {content: message})

    let args = message.slice(prefix.length).trim().split(/ +/)
    let command = args.shift().toLowerCase()

    if(command === "reload" || command === "refresh"){
        localStorage.setItem("reloaded", "true")
        window.location.reload()
        return
    }else if(command === "name"){
        systemMessage(`Your current name is: ${user.name}`)
        return
    }else if(command === "setname"){
        if(!args[0]) return systemMessage("Please provide a name!", true)
        socket.emit("name", {name: args[0]})
        systemMessage(`Set name to: ${args[0]}`)
        return
    }else if(command === "darkmode"){
        if(!args[0]){
            setDark(true)
            systemMessage(`Set theme to Dark`)
        }else if(args[0] === "on"){
            setDark(true)
            systemMessage(`Set theme to Dark`)
        }else if(args[0] === "off"){
            setDark(false)
            systemMessage(`Set theme to Light`)
        }else if(args[0] === "toggle"){
            setDark(!dark)
            systemMessage(`Set theme to ${dark ? "Dark" : "Light"}`)
        }
        return
    }else if(command === "lightmode"){
        if(!args[0]){
            setDark(false)
            systemMessage(`Set theme to Light`)
        }else if(args[0] === "on"){
            setDark(false)
            systemMessage(`Set theme to Light`)
        }else if(args[0] === "off"){
            setDark(true)
            systemMessage(`Set theme to Dark`)
        }else if(args[0] === "toggle"){
            setDark(!dark)
            systemMessage(`Set theme to ${dark ? "Dark" : "Light"}`)
        }
        return
    }else if(command === "colour" || command === "color") {
        systemMessage(`Your current colour is: ${user.colour}`)
        return
    }else if(command === "setcolour" || command === "setcolor"){
        if(!args[0]) return systemMessage("Please provide a colour!", true)
        socket.emit("colour", {colour: args[0]})
        systemMessage(`Set colour to: ${args[0]}`)
        return
    }else if(command === "reset"){
        if(!args[0]) return systemMessage("Valid arguments: position, zoom")
        if(args[0] === "pos" || args[0] === "position"){
            setOffset(0,0)
            systemMessage("Reset position")
        }else if(args[0] === "zoom" || args[0] === "scale"){
            setScale(defaultScale)
            systemMessage("Reset zoom")
        }else{
            systemMessage("Valid arguments: position, zoom")
        }
        return
    }else if(command === "clear" || command === "clearchat"){
        elements.chat.innerHTML = ""
        return
    }else if(command === "ping" || command === "latency"){
        systemMessage(`Your ping is: ${ping}ms`)
        return
    }else if(command === "online" || command === "players" || command === "users"){
        systemMessage(`There are ${online} users online`)
        return
    }else if(command === "sound" || command === "sound"){
        if(!args[0]){
            systemMessage(`Sound is currently ${sound ? "enabled" : "disabled"}`)
        }else if(args[0] === "on"){
            setSound(true)
            systemMessage("Enabled sound")
        }else if(args[0] === "off"){
            setSound(false)
            systemMessage("Disabled sound")
        }else if(args[0] === "toggle"){
            setSound(!sound)
            systemMessage(`${sound ? "Enabled" : "Disabled"} sound`)
        }else{
            systemMessage("Valid arguments: on, off, toggle")
        }
        return
    }else if(command === "commands" || command === "help"){
        sendHelp()
        return
    }else if(command === "controls"){
        sendControls()
        return
    }


    systemMessage("Type /help for a list of commands")
}

elements.canvas.addEventListener("mousemove", (event) => {
    mousePos = {x: event.offsetX, y: event.offsetY}
})

String.prototype.toHtmlEntities = function() {
    return this.replace(/./gm, function(string) {
        return (string.match(/[a-z\d\s]+/i)) ? string : "&#" + string.charCodeAt(0) + ";";
    })
}

socket.on("message", (message) => {
    message.author = message.author.toHtmlEntities()
    message.content = message.content.toHtmlEntities()

    elements.chat.innerHTML += `<div class="message"><div class="user">${message.author}:</div><div class="content">${message.content}</div></div>`
})

if(localStorage.getItem("reloaded")){
    systemMessage("Reloaded Page")
    localStorage.removeItem("reloaded")
}

elements.toolbar.commands.addEventListener("click", () => {
    sendHelp()
})

elements.toolbar.controls.addEventListener("click", () => {
    sendControls()
})