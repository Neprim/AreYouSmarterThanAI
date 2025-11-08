const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')




const authorize_user = function(req, res) {
    let token = req.cookies?.auth_token 
    if (!token) {
        return undefined
    }
    
    try {
        token = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return undefined
    }

    let user = db.users?.[token.username]

    return user
}

exports.authorization = function(req, res, next) {
    const user = authorize_user(req, res)

    req.user = user

    next()
}

exports.check_authorization = function(req, res, next) {
    if (!req.user) {
        return res.status(401).end()
    }

    next()
}