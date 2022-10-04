const fs = require("fs")
const path = require("path")
const configuration = require("./config")
const chalk = require("chalk")
const date = require("date-and-time")

let logFile = date.format(new Date(), configuration.get().logger.file.name)

let format = (content = "", type = "", isFile = false) => {
    let time = date.format(new Date(), configuration.get().logger.time)

    if (type) type = `[${type.toUpperCase()}]`

    content = content.toString()

    content = content.replace(/\n/g, `\n${" ".repeat(time.length + type.length + configuration.get().logger.linegap + 2)}`)

    if (!isFile) {
        content = content
            .replace(new RegExp(`Process exited with code: ${type !== "[FATAL]" ? "0" : "1"} [(]With${type !== "[FATAL]" ? "out" : ""} Errors[)]`, "g"), `Process exited with code: ${chalk.yellowBright(type !== "[FATAL]" ? "0" : "1")} ${chalk.gray(type !== "[FATAL]" ? "(Without Errors)" : "(With Errors)")}`)

        switch (type) {
            case "[INFO]": type = chalk.blueBright(type); break
            case "[DEBUG]": type = chalk.gray(type); break
            case "[CONFIG]": type = chalk.greenBright(type); break
            case "[WARNING]": type = chalk.yellow(type); break
            case "[ERROR]": type = chalk.redBright(type); break
            case "[FATAL]": type = chalk.red(type); break
            default: break
        }

        type = chalk.bold(type)
    }

    return `${time}${type ? " " : ""}${type} ${content}`
}

let file = (content, type) => {
    let dir = `./${configuration.get().logger.file.path}`
    try { if(!fs.existsSync(dir)) { fs.mkdirSync(dir) } fs.appendFileSync(`${dir}/${logFile}`, `${format(content, type, true)}\n`, "utf-8") }
    catch (error) { console.log(`${date.format(new Date(), configuration.get().logger.time)} ${chalk.redBright("[ERROR]")} Could not save log to file: ${error}`) }
}

let blank = (amount = 1) => {
    try { fs.appendFileSync(`./${configuration.get().logger.file.path}/${logFile}`, "\n", "utf-8") }
    catch (error) { console.log(`${date.format(new Date(), configuration.get().logger.time)} ${chalk.redBright("[ERROR]")} Could not save log to file: ${error}`) }
    console.log(amount > 1 ? "\n".repeat(amount - 1) : "")
}

let raw = (content) => {
    try { fs.appendFileSync(`./${configuration.get().logger.file.path}/${logFile}`, `${content}\n`, "utf-8") }
    catch (error) { console.log(`${date.format(new Date(), configuration.get().logger.time)} ${chalk.redBright("[ERROR]")} Could not save log to file: ${error}`) }
    console.log(content)
}

let debug = (content) => {
    if (!configuration.get().logger.debug) return
    else if (!content) return blank()
    file(content, "debug")
    console.log(format(content, "debug"))
}

let log = (content) => { file(content); console.log(format(content)) }
let info = (content) => { file(content, "info"); console.log(format(content, "info")) }
let config = (content) => { file(content, "config"); console.log(format(content, "config")) }
let warning = (content) => { file(content, "warning"); console.log(format(content, "warning")) }
let error = (content) => { file(content, "error"); console.log(format(content, "error")) }
let fatal = (content) => { file(content, "fatal"); console.log(format(content, "fatal")) }

let clear = () => {
    try {
        let dir = `./${configuration.get().logger.file.path}`

        fs.readdir(dir, (error, files) => {
            if (error) throw error

            for (const file of files) {
                fs.unlink(path.join(dir, file), error => { if (error) throw error })
            }
        })

        info("Cleared logs")
    } catch (error) { console.log(`${date.format(new Date(), configuration.get().logger.time)} ${chalk.redBright("[ERROR]")} Could not clear logs`) }
}

process.on('exit', (code) => { eval(`code !== 1 ? code = 0 : code = 1; ${code !== 1 ? "info" : "fatal"}("Process exited with code: ${code} (With${code !== 1 ? "out" : ""} Errors)")`) })
process.on('uncaughtException', error => { fatal(error.stack); process.exit(1) })
process.on('unhandledRejection', error => { fatal(error.stack); process.exit(1) })
process.on('SIGINT', () => process.exit(0))

debug("Logger Initialized")
debug()

module.exports = { blank, raw, log, info, debug, config, warning, error, fatal, clear }