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
        maxlength: 30,
        minlength: 6
    },
    routines: Array[Schema.Types.ObjectId]
})

module.exports = model('User', userSchema)