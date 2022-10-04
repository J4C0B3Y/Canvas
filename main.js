const config = require("./utils/config")
const logger = require("./utils/logger")
const http = require("http")
const express = require("express")
const sockets = require("socket.io")
const app = express()
const server = http.createServer(app)
const io = new sockets.Server(server)
const settings = config.get().canvas
const uuid = require("uuid")

let users = []

let getOnline = () => {
    return users.filter(user => user.online > 0).length
}

let canvas = {
    width: settings.width,
    height: settings.height,
    scale: settings.scale,
    cooldown: settings.cooldown,
    data: []
}

class User {
    token
    cooldown = 0
    colour = "#000000"
    name
    online = 0

    constructor(token) {
        this.token = token
        this.name = `Guest-${token.substring(0, 8)}`
    }
}

server.listen(config.get().server.port, () => {
    logger.info(`Web server listening on port: ${config.get().server.port}`)
})

app.use(express.static("public"))

io.on('connection', (socket) => {
    let user

    logger.debug(`Socket Connected: ${socket.id}`)

    socket.on('disconnect', () => {
        logger.debug(`Socket Disconnected: ${socket.id}`)
        if (user) user.online--
        io.emit("online", {online: getOnline()})
    })

    socket.on("token", (data) => {
        let token = data.token && uuid.validate(data.token) && uuid.version(data.token) === 4 ? data.token : uuid.v4()
        socket.emit("token", {token: token})

        let existing = users.find(user => user.token === token)

        if(existing){
            user = existing
        }else{
            user = new User(token)
            users.push(user)
        }

        user.online++
        io.emit("online", {online: getOnline()})
    })

    socket.on("request", () => {
        socket.emit("request", ({
            width: canvas.width,
            height: canvas.height,
            scale: canvas.scale,
            data: canvas.data,
        }))
    })

    socket.on("draw", (data) => {
        if(!user) return socket.emit("error", {code: 1}) // No User
        if(!user.name) return socket.emit("error", {code: 2}) // No Name
        if(user.cooldown > Date.now()) return socket.emit("error", {cooldown: user.cooldown - Date.now(), code: 3}) // Cooldown
        if(!(data && data.colour && !isNaN(data.x)  && !isNaN(data.y))) return socket.emit("error", {code: 4}) // No Data
        if(Math.floor(data.x) !== data.x || Math.floor(data.y) !== data.y) return socket.emit("error", {code: 5}) // Position not whole
        if(!/^#([0-9A-F]{3}){1,2}$/i.test(data.colour)) return socket.emit("error", {code: 6}) // Not a colour
        if(data.x < 0 || data.x >= canvas.width || data.y < 0 || data.y >= canvas.height) return socket.emit("error", {code: 7}) // Out of bounds

        let index
        let pixel = {
            x: data.x,
            y: data.y,
            colour: user.colour,
            name: user.name
        }

        io.emit("draw", pixel)

        user.cooldown = Date.now() + canvas.cooldown

        let existing = canvas.data.find(pixel => pixel.x === data.x && pixel.y === data.y)
        if (existing) index = canvas.data.findIndex(object => object.x === existing.x && object.y === existing.y)

        existing ? canvas.data[index] = pixel : canvas.data.push(pixel)
    })

    socket.on("name", (data) => {
        if(!user) return
        if(!data) return
        if(!data.name) return

        user.name = data.name
    })

    socket.on("colour", (data) => {
        if(!user) return
        if(!data) return
        if(!data.colour) return

        user.colour = data.colour
    })

    socket.on("user", () => {
        socket.emit("user", {
            cooldown: user.cooldown,
            name: user.name,
            token: user.token,
            colour: user.colour
        })
    })
})