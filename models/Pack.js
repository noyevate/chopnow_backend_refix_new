const mongoose = require('mongoose');

const PackSchema = new mongoose.Schema({
    restaurantId: { type: String, required: true },
    packName: { type: String, required: true },
    packDescription: { type: String, required: false },
    price: { type: Number, required: false },
    isAvailable: { type: Boolean, default: true }
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Pack', PackSchema);