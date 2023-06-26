const mongoose = require("mongoose")

const ofrSchema = mongoose.Schema({

    categoryName: {
        type: String,
        required: true
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
        type: Date
    },
      endDate: {
        type: Date
    },

});

module.exports = mongoose.model('offer', ofrSchema)