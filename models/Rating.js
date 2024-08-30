const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    name: {type: String, default: ""},
    comment: { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Rating', RatingSchema);
