const mongoose = require('mongoose');

const RiderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
    vehicleImgUrl: { type: String, required: true },
    vehicleType: { type: String, required: true },
    vehicleBrand: { type: String, required: true },
    plateNumber: { type: String, required: true },
    guarantors: { type: Array, default: [] },
    bankName: { type: String, required: true },
    bankAccount: { type: String, required: true },
    bankAccountName: { type: String, required: true },
    workDays: {
        morningShifts: { type: Array, default: [] },
        afternoonShift: { type: Array, default: [] },
    },
    userImageUrl: { type: String, required: true },
    particularsImageUrl:{ type: String, required: false, default:"" },
    driverLicenseImageUrl:{ type: String, required: fals, default:""},
    rating: { type: Number, min: 1.0, max: 5.0, default: 3.1 },
    ratingCount: { type: Number, default: 267 },
    verification: { type: String, default: "Pending", enum: ["Pending", "Verified", "Rejected"] },
    verificationMessage: { type: String, default: "Your restaurant is under review, we will notify you once it is verified" },
    coords: {

        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        latitudeDelta: { type: Number, default: 0.0122 },
        longitudeDelta: { type: Number, default: 0.0122 },
        postalCode: { type: Number, required: true },
        title: { type: String, required: true },
    },

}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Rider', RiderSchema);