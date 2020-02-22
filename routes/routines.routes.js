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
        return res.status(400).json({message: 'Not valid title or repeat field'})
    }

    // get user from db, add new routine, connect routine to user
    try {
        const user = await User.findById(req.authorized)
        if (!user) {
            return res.status(401).json({message: 'You need to login'})            
        }

        const routine = new Routine({
            title: req.body.title,
            value: req.body.value,
            userId: user._id,
            created: createFormattedDate()
        })
        await routine.save()

        return res.json({
            message: 'Routine added',
            routine: routine
        })

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error...'})
    }
})

router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.authorized)
        if (!user) {
            return res.status(401).json({ message: 'You need to login' })
        }

        const routines = await Routine.find({ userId: user._id })

        return res.json({ routines })

    } catch (err) {
        return res.status(500).json({message: 'Some Server Error...'})
    }
})

router.delete('/', async(req, res) => {
    try {
        const { routineId } = req.body
        const userId = req.authorized

        if (!routineId) {
            return res.status(400).json({ message: 'Not correct requiest' })
        }

        const routine = await Routine.findById(routineId)
        if (!routine) {
            return res.status(404).json({ message: 'Routine not found' })
        }

        if (routine.userId.toString() !== userId) {
            return res.status(404).json({ message: 'Routine not found' })
        }

        const report = await Routine.deleteOne({ _id: routineId })
        if (report.deletedCount !== 1) {
            return res.status(400).json({ message: 'Something went wrong' })
        }

        return res.json({
            message: 'Routine Deleted',
            routineId
        })

    } catch (err) {
        return res.status(500).json({ message: 'Some Server Error...' })
    }
})

router.post('/done', async(req, res) => {
    try {
        const { routineId } = req.body
        const userId = req.authorized

        if (!routineId) {
            return res.status(400).json({ message: 'Not correct requiest' })
        }

        const routine = await Routine.findById(routineId)
        if (!routine) {
            return res.status(404).json({message: 'Routine not found'})
        }

        if (routine.userId.toString() !== userId) {
            return res.status(404).json({message: 'Routine not found'})
        }

        routine.done.push(createFormattedDate())
        await routine.save()

        return res.json({message: 'Routine Done', routine})
    } catch (err) {
        return res.status(500).json({ message: 'Some Server Error...' })
    }
})

module.exports = router