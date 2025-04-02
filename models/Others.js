const mongoose = require('mongoose');

const OtherSchma = new mongoose.Schema({
    minLat: {type: Number, default: 0.05},
    maxLat: {type: Number, default: 0.05},
    minLng: {type: Number, default: 0.05},
    maxLng: {type: Number, default: 0.05},
    
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Other', OtherSchma)