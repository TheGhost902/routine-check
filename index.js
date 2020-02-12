const express = require('express')
const mongoose = require('mongoose')
const config = require('config')
const cookieParser = require('cookie-parser')

const authorization = require('./middleware/authorization')

const PORT = process.env.PORT || 3001
const app = express()

app.use(express.static('client'))
app.use(express.json())
app.use(cookieParser())

app.use('/auth', require('./routes/auth.routes'))

app.get('/test', authorization, (req, res) => {
    if (req.authorized) {
        return res.json({routines: ['check email', 'clear garage', 'buy new socks']})
    } 

    return res.status(401).json({message: 'from /test: You are not logged in'})
})


async function start() {
    try {
        await mongoose.connect(config.get('mongoUri'), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        })

        app.listen(PORT, () => {
            console.log(`App on port ${PORT}...`)
        }).on('error', err => {throw err})

    } catch (err) {
        console.log(err)
    }
}
start()