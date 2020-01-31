const { Router } = require('express')
const User = require('../models/User')

const router = Router()

router.post('/login', (req, res) => {
    console.log(req.body)
    res.json('OK')
})

router.post('/register', async (req, res) => {//-------------------- ДОБАВИТ ВАЛИДАЦИЮ
    try {
        const isUser = await User.findOne({ login: req.body.login })

        if (!isUser) {
            const user = new User({
                login: req.body.login,
                password: req.body.password
            })

            const userData = await user.save()
            res.cookie('userId', userData._id) ///---------------------------- JWT
            return res.json(userData._id) //----------------------------------------------
        }

        res.json({ message: 'This username already exists' })

    } catch (err) {
        res.status(500).json('Some Server Error...')
    }
})

module.exports = router