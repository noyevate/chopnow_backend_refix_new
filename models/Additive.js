const mongoose = require('mongoose');

const AdditiveSchema = new mongoose.Schema({
    restaurantId: {type: String, required:true},
    additiveTitle: {type: String, required:true},
    additiveName: {type: String, required:true},
    max: {type: Number, required:false},
    min: {type: Number, required:false},
    price: {type: Number, required:true},
    foods: { type: Array, default: [] },
    isAvailable: {type: Boolean, default:true},
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Additives', AdditiveSchema)