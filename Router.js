const express = require("express")
const Router = express.Router()

Router.get(`/login`, (req, res) => {
    res.render('login', { })
})

Router.get(`/register`, (req, res) => {
    res.render('register', { })
})

Router.get(`/`, (req, res) => {
    // Добавить проверку на авторизацию
    // Хотя мб пускай и просто могут видеть резы других
    res.render('main', {  })
})

module.exports = Router