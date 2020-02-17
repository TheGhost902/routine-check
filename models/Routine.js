const { Schema, model } = require('mongoose')

const routineSchema = new Schema({
    title: {
        type: String,
        required: true,
        minlength: 1
    },
    value: {
        type: String,
        required: true,
        minlength: 1
    },
    created: {
        type: Date,
        default: Date.now
    },
    failed: {
        type: [Date],
        required: true,
        default: []
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = model('Routine', routineSchema)