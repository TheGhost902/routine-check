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
    routines: Array
})

module.exports = model('User', userSchema)