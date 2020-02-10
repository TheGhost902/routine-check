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

        // update refresh token in db
        user.refreshToken = createRefreshToken(user)
        await user.save()

        // set tokens in cookie, send message and id to user
        return setCookie(res, createToken(user), user.refreshToken)
            .json({
                userId: user._id,
                message: 'Login successful'
            })

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error...'})
    }    
})

router.post('/register', validationMiddleware, async (req, res) => {
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
                refreshToken: createRefreshToken(req.body)
            })

            await user.save()
            const token = createToken(user)

            // set tokens in cookies, send message and id to user
            return setCookie(res, token, user.refreshToken)
                .json({
                    userId: user._id,
                    message: 'Successful registration'
                })
        }

        // if user already exists, send error message
        return res.status(400).json({message: 'This username already exists'})

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error...'})
    }
})

router.use('/refreshtokens', async (req, res) => {
    try {
        const refreshToken = req.cookies['refresh_token']

        // refreshtoken availability check
        if (!refreshToken) {
            return res.status(401).json({message: 'Invalid authorization, please log in again'})
        }

        try {
            // try to verify a token
            const payload = jwt.verify(refreshToken, config.get('jwtSecret'))

            // search a token owner
            const user = await User.findOne({login: payload.login})
            if (!user) {
                return res.status(400).json({message: 'Invalid authorization, please log in again'})
            }

            // tokens matching
            if (user.refreshToken !== refreshToken) {
                return res.status(401).json({message: 'You need to log in'})
            }

            // create and updete refresh token
            user.refreshToken = createRefreshToken(user)
            await user.save()

            // set tokens in cookies, and redirect back
            return setCookie(res, createToken(user), user.refreshToken)
                .clearCookie('from')
                .redirect(req.cookies.from)
        } catch (err) {
            // if token verify is failed
            console.log(err)
            return res.status(401).json({message: 'You need to log in'})
        }

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error'})
    }
})

module.exports = router