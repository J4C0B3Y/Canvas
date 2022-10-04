const fs = require("fs")
const yaml = require("js-yaml")

let config
let loaded = false;

let load = () => {
    config = yaml.load(fs.readFileSync("./config.yml", "utf-8"))
    loaded = true
}

let reload = () => { if (loaded) load() }

let get = () => {
    if(!loaded) load()
    return config
}

module.exports = { load, reload, get }