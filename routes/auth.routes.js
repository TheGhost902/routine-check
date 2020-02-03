// Authorization router '/auth...'
// routes: 
//      POST '/login' - login in app, return access and refresh tokens + message for user
//      POST '/register - register in app, return access and refresh tokens + message for user

const { Router } = require('express')
const jwt = require('jsonwebtoken')
const config = require('config')
const hash = require('hash.js')
const User = require('../models/User')

const router = Router()

router.use(require('../middleware/validation'))

router.post('/login', async (req, res) => {
    try {
        // login and password fields validation (from validation middleware)
        if (!req.body.validation) {
            return res.status(400).json({message: 'Not valid Login or Password'})
        }

        // find user in database
        const user = await User.findOne({login: req.body.login})
        if (!user) {
            return res.status(400).json({message: 'Not correct Login or Password'})
        }

        // chech user password
        const passwordHash = hash.sha256().update(req.body.password + config.get('passwordSecret')).digest('hex')
        if (passwordHash !== user.password) {
            return res.status(400).json({message: 'Not correct Login or Password'})
        }

        // prepare new access and refresh tokens
        const dataToSend = {
            token: jwt.sign({userId: user._id}, config.get('jwtSecret'), {expiresIn: '5m'}),
            refreshToken: jwt.sign({login: user.login}, config.get('jwtSecret'), {expiresIn: '1d'}),
            login: user.login
        }

        // update refresh token in db
        user.refreshToken = dataToSend.refreshToken
        await user.save()

        // send tokens and message to user
        return res.json({
            ...dataToSend,
            message: 'Login successful'
        })

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error...'})
    }    
})

router.post('/register', async (req, res) => {
    try {
        // login and password fields validation (from validation middleware)
        if (!req.body.validation) {
            return res.status(400).json({message: 'Not valid Login or Password'})
        }

        // find user in database
        const isUserInDB = await User.findOne({login: req.body.login})

        // if have no user in db, create a new one
        if (!isUserInDB) {
            const user = new User({
                login: req.body.login,
                password: hash.sha256().update(req.body.password + config.get('passwordSecret')).digest('hex'),
                refreshToken: jwt.sign({login: req.body.login}, config.get('jwtSecret'), {expiresIn: '1d'})
            })

            const userData = await user.save()
            const token = jwt.sign({userId: userData._id}, config.get('jwtSecret'), {expiresIn: '5m'})

            // send tokens and message to user
            return res.json({
                token,
                refreshToken: user.refreshToken,
                message: 'Successful registration'
            })
        }

        // if user already exists, send error message
        return res.status(400).json({message: 'This username already exists'})

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error...'})
    }
})

module.exports = router