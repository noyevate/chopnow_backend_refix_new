const mongoose = require('mongoose');

const RiderRatingSchema = new mongoose.Schema({
    restaurantId: { type: String, default: "" },
    userId: { type: String, default: "" },
    orderId: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    name: {type: String, default: ""},
    comment: { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('RiderRating', RiderRatingSchema);
