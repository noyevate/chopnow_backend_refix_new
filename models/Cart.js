const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    productId: {type: mongoose.Schema.Types.ObjectId, ref:'Food', required:true},
    additives: {type: Array, required:false, default:[]},
    totalPrice: {type: Number, required:true},
    
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v; 
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Cart', CartSchema)