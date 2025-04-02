const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema({
    basePrice: { type: Number },
    serviceFee: {type: Number},
    time: { type: Date, default: Date.now },
    oldPrices: [ // Array to store historical prices
        {
            price: { type: Number, required: true }, // Old price value
            time: { type: Date, required: true } // Timestamp when this price was active
        }
    ]

}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
        }
    },
    timestamps: true
}
);

module.exports = mongoose.model('Price', PriceSchema);
