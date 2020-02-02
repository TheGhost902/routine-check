const { Router } = require('express')
const jwt = require('jsonwebtoken')
const config = require('config')
const hash = require('hash.js')
const User = require('../models/User')

const router = Router()

router.use(require('../middleware/validation'))

router.post('/login', (req, res) => {
    console.log(req.body)
    res.json('OK')
})

router.post('/register', async (req, res) => {
    try {
        if (!req.body.validation) {
            return res.status(400).json({message: 'Not correct Login or Password'})
        }

        const isUserInDB = await User.findOne({login: req.body.login})

        if (!isUserInDB) {
            const user = new User({
                login: req.body.login,
                password: hash.sha256().update(req.body.password + config.get('passwordSecret')).digest('hex'),
                refreshToken: jwt.sign({login: req.body.login}, config.get('jwtSecret'), {expiresIn: '1d'})
            })

            const userData = await user.save()
            const token = jwt.sign({userId: userData._id}, config.get('jwtSecret'), {expiresIn: '5m'})

            return res.json({
                token,
                refreshToken: user.refreshToken,
                message: 'Successful registration'
            })
        }

        res.status(400).json({message: 'This username already exists'})

    } catch (err) {
        res.status(500).json({message: 'Some Server Error...'})
    }
})

module.exports = router