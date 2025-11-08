const Express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
const fs = require("fs")
require('dotenv').config()
const path = require('path');

let _db = {users: {}}
if (fs.existsSync("db.json")) {
    _db = require("./db.json")
}

let update_time = 0
global.db = new Proxy(_db, {
    get(target, prop) {
        if (prop == "users") {
            update_time = Date.now()
            setTimeout(() => {
                if (update_time <= Date.now() + 1000) {
                    fs.writeFileSync("db.json", JSON.stringify(_db))
                    update_time = Date.now()
                }
            }, 1000)
        }

        return target[prop]
    }
})

global.questions = require("./questions.json")

global.app = Express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.disable('x-powered-by')
app.engine(
    'handlebars',
    handlebars.engine({ defaultLayout: 'main' })
)
app.set('views', './pages')
app.set('view engine', 'handlebars')

let arg_port
for (let i = 0; i < process.argv.length; i++) {
    let arg = process.argv[i]
    if (arg == "-p" || arg == "--port") {
        if (i + 1 < process.argv.length && !isNaN(Number(process.argv[i + 1]))) {
            arg_port = Number(process.argv[i + 1])
        }
    }
}

const Router = require('./Router')
app.use('/', Router)





const port = arg_port || process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Сервер работает на порте ${port}`)
})
