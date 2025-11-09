const express = require("express")
const Router = express.Router()
const Authorization = require("./Authorization")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

Router.use(Authorization.authorization)

Router.get(`/login`, (req, res) => {
    if (req.user)
        return res.redirect("/")
    res.render('login', { })
})

Router.get(`/register`, (req, res) => {
    if (req.user)
        return res.redirect("/")
    res.render('register', { })
})

Router.post(`/register`, (req, res) => {
    const n = req.body;
    let params = {}

    if (!n.username || n.username.length > 30) {
        params.error_login = "Имя не должно быть пустим и должно содержать не более 30 символов."
    }
    
    if (!n.password) {
        params.error_password = "Кодовое слово тоже не должно быть пустым."
    }
    
    if (db.users?.[n.username]) {
        params.error_login = "Кто-то уже заходил под таким именем. Выберите другое."
    }

    if (params.error_login || params.error_password)
        return res.render('register', params)

    db.users[n.username] = {
        username: n.username,
        password: n.password,
        last_activity: Date.now(),
        ips: [req.header('x-forwarded-for') || req.socket.remoteAddress],
        questions: [],
    }

    let token = jwt.sign({ username: n.username }, process.env.JWT_SECRET, { expiresIn: 5 * 12 * 30 * 24 * 60 * 60 * 1000 + 'd'})
    res.cookie('auth_token', token, { maxAge: 5 * 12 * 30 * 24 * 60 * 60 * 1000, httpOnly: true });

    return res.redirect('/')
})

Router.post(`/login`, async (req, res) => {
    const n = req.body;
    let params = {}

    if (!n.username) {
        params.error_login = "А кто заходит то?"
    }
    
    if (!n.password) {
        params.error_password = "А где кодовое слово?"
    }
    
    let user = db.users?.[n.username]
    if (!user) {
        params.error_login = "Никто под таким именем ни разу не заходил. Возможно, стоит нажать \"Я тут впервые\"."
    } else
    
    if (user?.password != n.password) {
        params.error_password = "Кодовое слово не совпадает с введённым ранее."
    }

    if (params.error_login || params.error_password)
        return res.render('login', params)
    
    let token = jwt.sign({ username: n.username }, process.env.JWT_SECRET, { expiresIn: 5 * 12 * 30 * 24 * 60 * 60 * 1000 + 'd'})
    res.cookie('auth_token', token, { maxAge: 5 * 12 * 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    
    let ip = req.header('x-forwarded-for') || req.socket.remoteAddress
    if (!db.users?.[n.username]?.ips?.includes(ip))
        db.users?.[n.username]?.ips?.push(ip)

    return res.redirect("/")
})

const questions_amount =  Object.keys(questions).length
Router.get(`/`, (req, res) => {
    let correct_answers = 0
    const qs = req?.user?.questions
    let tests = []
    for (let i = 0; i < Math.floor((qs?.length - (qs?.[qs?.length - 1].length == 1)) / 10); i++) {
        let test = {
            correct_answers: 0,
            correct_percent: 0,
        }
        for (let j = 0; j < 10; j++) {
            let q = req.user.questions[i * 10 + j]
            correct_answers += (questions[q[0]].answer == q[1])
            test.correct_answers += (questions[q[0]].answer == q[1])
        }
        test.correct_percent = Math.round(test.correct_answers * 100) / 10
        tests.push(test)
    }
    
    tests.reverse()

    const correct_percent = Math.round(correct_answers / Math.floor((qs?.length - (qs?.[qs?.length - 1].length == 1)) / 10) * 100) / 10

    res.render('main', { 
        user: req.user, 
        continue_test: req?.user?.questions?.[req?.user?.questions?.length - 1]?.length == 1, 
        tests_available: req?.user?.questions?.length < questions_amount, 
        questions_amount: questions_amount,
        correct_answers: correct_answers,
        total_answers: Math.floor((qs?.length - (qs?.[qs?.length - 1].length == 1)) / 10) * 10,
        correct_percent: correct_percent,
        tests: tests,
    })
})

const irand = (min, max) => Math.floor(Math.random() * (max - min) + min)

Router.get(`/test`, (req, res) => {
    if (!req.user)
        return res.redirect("/")
    
    let qs = req.user.questions
    if (qs.length == 0 || qs[qs.length - 1].length == 2) {
        // Неэффективно, да и пофиг. Как будто это будет сильно тормозить (потом узнаем).
        const free_qs = questions
            .map((q, ind) => {return {...q, ind: ind}})
            .filter((q) => !qs.find((uq) => q.ind == uq[0]))

        if (free_qs.length == 0) {
            return res.redirect("/")
        }

        req.user.questions.push([free_qs[irand(0, free_qs.length)].ind])
    }

    let q = questions[req.user.questions[qs.length - 1][0]]

    res.render('test', { user: req.user, question_number: qs.length % 10 || 10, question_text: q.text, answers: q.answers})
})

Router.post(`/test`, (req, res) => {
    if (!req.user)
        return res.redirect("/")
    
    let n = req.body
    let qs = req.user.questions
    
    if (qs[qs.length - 1]?.length != 1) {
        return res.render('/')
    }
        
    qs[qs.length - 1][1] = n.selected_answer

    if (qs.length % 10 == 0) {
        let correct_answers = 0
        for (let i = 0; i < 10; i++) {
            if (questions[qs[qs.length - 1 - i][0]].answer == qs[qs.length - 1 - i][1])
                correct_answers++
        }
        return res.render('results', { user: req.user, correct_answers: correct_answers })
    }

    res.redirect('/test')
})

module.exports = Router