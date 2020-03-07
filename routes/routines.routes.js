const { Router } = require('express')
const authorization = require('../middleware/authorization')
const Routine = require('../models/Routine')
const User = require('../models/User')

const router = Router()

function createFormattedDate() {
    const created = new Date()
    created.setHours(0)
    created.setMinutes(0)
    created.setSeconds(0)
    created.setMilliseconds(0)

    return created.toString()
}

router.use(authorization)

router.post('/add', async (req, res) => {
    // simple validation title and value fields
    let valid = true
    if (!req.body.title || !req.body.value) valid = false
    if (req.body.value.includes(' ')) valid = false
    if (req.body.value === '0') valid = false
    if (!valid) {
        return res.status(400).json({ message: { text: 'Not valid title or repeat field', type: 'error' }})
    }

    // get user from db, add new routine, connect routine to user
    try {
        const user = await User.findById(req.authorized)
        if (!user) {
            return res.status(401).json({ message: { text: 'You need to login', type: 'error'}})            
        }

        const routine = new Routine({
            title: req.body.title,
            value: req.body.value,
            userId: user._id,
            created: createFormattedDate()
        })
        await routine.save()

        return res.json({
            message: {
                text: 'Routine added',
                type: 'success'
            },
            routine: routine
        })

    } catch (err) {
        return res.status(500).json({ message: { text: 'Some Server Error...', type: 'error'}})
    }
})

router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.authorized)
        if (!user) {
            return res.status(401).json({ message: { text: 'You need to login', type: 'error'} })
        }

        const routines = await Routine.find({ userId: user._id })

        return res.json({ routines })

    } catch (err) {
        return res.status(500).json({ message: { text: 'Some Server Error...', type: 'error'}})
    }
})

router.delete('/', async(req, res) => {
    try {
        const { routineId } = req.body
        const userId = req.authorized

        if (!routineId) {
            return res.status(400).json({ message: {text: 'Not correct requiest', type: 'error'} })
        }

        const routine = await Routine.findById(routineId)
        if (!routine) {
            return res.status(404).json({ message: {text: 'Routine not found', type: 'error'} })
        }

        if (routine.userId.toString() !== userId) {
            return res.status(404).json({ message: {text: 'Routine not found', type: 'error'} })
        }

        const report = await Routine.deleteOne({ _id: routineId })
        if (report.deletedCount !== 1) {
            return res.status(400).json({ message: {text: 'Something went wrong', type: 'error'} })
        }

        return res.json({
            message: {
                text: 'Routine Deleted',
                type: 'success'
            },
            routineId
        })

    } catch (err) {
        return res.status(500).json({ message: { text: 'Some Server Error...', type: 'error'} })
    }
})

router.post('/done', async(req, res) => {
    try {
        const { routineId } = req.body
        const userId = req.authorized

        if (!routineId) {
            return res.status(400).json({ message: { text: 'Not correct requiest', type: 'error'}})
        }

        const routine = await Routine.findById(routineId)
        if (!routine) {
            return res.status(404).json({ message: { text: 'Routine not found', type: 'error'}})
        }

        if (routine.userId.toString() !== userId) {
            return res.status(404).json({ message: { text: 'Routine not found', type: 'error'}})
        }

        routine.done.push(createFormattedDate())
        await routine.save()

        return res.json({message:{
                text: 'Routine Done',
                type: 'success'
            },
            routine
        })
    } catch (err) {
        return res.status(500).json({ message: { text: 'Some Server Error...', type: 'error'}})
    }
})

module.exports = router