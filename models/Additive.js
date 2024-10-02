const mongoose = require('mongoose');

const AdditiveSchema = new mongoose.Schema({
    restaurantId: {type: String, required:true},
    title: {type: String, required:true},
    max: {type: Number, required:false},
    min: {type: Number, required:false},
    name: {type: String, required: true},
    price: {type: Number, required:true},
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Additives', AdditiveSchema)