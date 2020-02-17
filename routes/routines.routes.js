const { Router } = require('express')
const authorization = require('../middleware/authorization')
const Routine = require('../models/Routine')
const User = require('../models/User')

const router = Router()

router.use(authorization)

router.post('/add', async (req, res) => {
    // simple validation title and value fields
    let valid = true
    if (!req.body.title || !req.body.value) valid = false
    if (req.body.value.includes(' ')) valid = false
    if (req.body.value === '0') valid = false
    if (!valid) {
        return res.json({message: 'Not valid title or repeat field'})
    }

    // get user from db, add new routine, connect routine to user
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(401).json({message: 'You need to login'})            
        }

        const routine = new Routine({
            title: req.body.title,
            value: req.body.value,
            userId: user._id
        })
        await routine.save()

        return res.json({
            message: 'Routine added',
            routineId: routine._id
        })

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error...'})
    }
})

module.exports = router