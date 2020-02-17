const { Schema, model } = require('mongoose')

const userSchema = new Schema({
    login: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true
    }
})

module.exports = model('User', userSchema)