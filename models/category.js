
const mongoose = require("mongoose")

const catSchema = mongoose.Schema({

    name: {
        type: String,
        // unique: true,
        uppercase: true,
        required: true,
    },

    is_available: {
        type: Number,
        default: 1,
        required: true
    },
    discountPercentage: {
        type: Number,
        default: 0,
    },
    startDate: {
        type: Date,
    },
      endDate: {
        type: Date,
    },

});

module.exports = mongoose.model('category', catSchema)
