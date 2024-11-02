const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    title: { type: String, required: true },
    time: { type: Array, default: [] },
    imageUrl: { type: String, required: true },
    foods: { type: Array, default: [] },
    pickup: { type: Boolean, default: false },
    restaurantMail: {type: String, required: true},
    delivery: { type: Boolean, default: true },
    isAvailabe: { type: Boolean, default: true },
    phone: { type: String, required: true },
    code: { type: String, required: false },
    logoUrl: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    rating: { type: Number, min: 1.0, max: 5.0, default: 3.1 },
    ratingCount: { type: String, default: 267 },
    verification: { type: String, default: "Pending", enum: ["Pending", "Verified", "Rejected"] },
    verificationMessage: { type: String, default: "Your restaurant is under review, we will notify you once it is verified" },
    coords: {
        id: { type: String },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        latitudeDelta: { type: Number, default: 0.0122 },
        longitudeDelta: { type: Number, default: 0.0122 },
        address: { type: String, required: true },
        title: { type: String, required: true },
    },
    restaurant_categories: [{
        name: { type: String, required: false },
        additives: { type: Array, default: [] }
    }]
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
