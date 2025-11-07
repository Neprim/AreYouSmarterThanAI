const Express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
require('dotenv').config()
const path = require('path');

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
