const express = require('express')
const mongoose = require('mongoose')
const config = require('config')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')

const authorization = require('./middleware/authorization')

const PORT = process.env.PORT || 3001
const app = express()

app.use(morgan('dev'))
app.use(express.static('client'))
app.use(express.json())
app.use(cookieParser())

app.use('/auth', require('./routes/auth.routes'))
app.use('/routines', require('./routes/routines.routes'))

app.get('/test', authorization, (req, res) => {
    if (req.authorized) {
        return res.json({routines: ['check email', 'clear garage', 'buy new socks']})
    } 

    return res.status(401).json({message: 'from /test: You are not logged in'})
})

app.use((req, res) => {
    res.redirect('/')
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

process.on('SIGINT', async () => {
    await mongoose.connection.close()
    console.log('Disconnected from DB')
    process.exit()
})