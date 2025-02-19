const mongoose = require('mongoose');

const RiderRatingSchema = new mongoose.Schema({
    riderId: { type: String, default: "" },
    userId: { type: String, default: "" },
    orderId: { type: String, default: "" },
    rating: { type: Number, min: 1.0, max: 5.0, required: true },
    name: {type: String, default: ""},
    comment: { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('RiderRating', RiderRatingSchema);
