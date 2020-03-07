// Authorization router '/auth...'
// routes: 
//      POST '/login' - login in app, set access and refresh tokens in cookie, return message and user id
//      POST '/register' - register in app, set access and refresh tokens in cookie, return message and user id
//      any '/refreshtokens' - update access and refresh tokens, set tokens in cookie, redirect back

const { Router } = require('express')
const jwt = require('jsonwebtoken')
const config = require('config')
const hash = require('hash.js')
const User = require('../models/User')
const validationMiddleware = require('../middleware/validation')

const router = Router()

function createToken(user) {
    return jwt.sign({userId: user._id}, config.get('jwtSecret'), {expiresIn: config.get('accessTokenTime')})
}
function createRefreshToken(user) {
    return jwt.sign({login: user.login}, config.get('jwtSecret'), {expiresIn: config.get('refreshTokenTime')})
}
function setCookie(res, token, refreshToken) {
    res
        .cookie(
            'access_token',
            token,
            {sameSite: true, httpOnly: true}
        )
        .cookie(
            'refresh_token',
            refreshToken,
            {sameSite: true, path: '/auth/refreshtokens', httpOnly: true}
        )

    return res
}

router.post('/login', validationMiddleware, async (req, res) => {
    try {
        // login and password fields validation (from validation middleware)
        if (!req.body.validation) {
            return res.status(400).json({message: {text: 'Not valid Login or Password', type: 'error'}})
        }

        // find user in database
        const user = await User.findOne({login: req.body.login})
        if (!user) {
            return res.status(400).json({message: {text: 'Not correct Login or Password', type: 'error'}})
        }

        // chech user password
        const passwordHash = hash.sha256().update(req.body.password + config.get('passwordSecret')).digest('hex')
        if (passwordHash !== user.password) {
            return res.status(400).json({ message: { text: 'Not correct Login or Password', type: 'error' }})
        }

        // update refresh token in db
        user.refreshToken = createRefreshToken(user)
        await user.save()

        // set tokens in cookie, send message and id to user
        return setCookie(res, createToken(user), user.refreshToken)
            .json({
                userId: user._id,
                message: {
                    text: 'Login successful',
                    type: 'success'
                }
            })

    } catch (err) {
        return res.status(500).json({message: {text: 'Some Server Error...', type: 'error'}})
    }    
})

router.post('/register', validationMiddleware, async (req, res) => {
    try {
        // login and password fields validation (from validation middleware)
        if (!req.body.validation) {
            return res.status(400).json({ message: {text: 'Not valid Login or Password', type: 'error'}})
        }

        // find user in database
        const isUserInDB = await User.findOne({login: req.body.login})

        // if have no user in db, create a new one
        if (!isUserInDB) {
            const user = new User({
                login: req.body.login,
                password: hash.sha256().update(req.body.password + config.get('passwordSecret')).digest('hex'),
                refreshToken: createRefreshToken(req.body)
            })

            await user.save()
            const token = createToken(user)

            // set tokens in cookies, send message and id to user
            return setCookie(res, token, user.refreshToken)
                .json({
                    userId: user._id,
                    message: {
                        text: 'Successful registration',
                        type: 'success'
                    }
                })
        }

        // if user already exists, send error message
        return res.status(400).json({ message: {text: 'This username already exists', type: 'error'}})

    } catch (err) {
        return res.status(500).json({ message: {text: 'Some Server Error...', type: 'error'}})
    }
})

router.use('/refreshtokens', async (req, res) => {
    try {
        const refreshToken = req.cookies['refresh_token']

        // refreshtoken availability check
        if (!refreshToken) {
            return res.status(401).json({ message: {text: 'Invalid authorization, please log in again', type: 'error'}})
        }

        try {
            // try to verify a token
            const payload = jwt.verify(refreshToken, config.get('jwtSecret'))

            // search a token owner
            const user = await User.findOne({login: payload.login})
            if (!user) {
                return res.status(400).json({ message: {text: 'Invalid authorization, please log in again', type: 'error'}})
            }

            // tokens matching
            if (user.refreshToken !== refreshToken) {
                return res.status(401).json({ message: { text: 'You need to log in', type: 'error'}})
            }

            // create and updete refresh token
            user.refreshToken = createRefreshToken(user)
            await user.save()

            // set tokens in cookies, and redirect back
            return setCookie(res, createToken(user), user.refreshToken)
                .clearCookie('from')
                .redirect(307, req.cookies.from)
        } catch (err) {
            // if token verify is failed
            return res.status(401).json({ message: { text: 'You need to log in', type: 'error'}})
        }

    } catch (err) {
        return res.status(500).json({ message: { text: 'Some Server Error', type: 'error'}})
    }
})

module.exports = router