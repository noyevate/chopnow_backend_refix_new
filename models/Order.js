const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    foodId: {type: String, required:true},
    additives: {type: Array},
    instruction: {type: String, default: ''},
    numberOfPack: {type: Number, required:true, default: 1}
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});
const OrderSchema = new mongoose.Schema({
    userId: {type: String, required:true},
    orderItems: [OrderItemSchema],
    orderTotal: {type: Number, required:true},
    orderSubId: {type: Number, required:true},
    deliveryFee: {type: Number, required:true},
    grandTotal: {type: Number, required:true},
    deliveryAddress: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true
    },
    restaurantAddress: {
        type: String,  required: true
    },
    paymentMethod: {type: String, required:true},
    paymentStatus: {type: String, default: "Pending", enum: ["Pending", "Completed", "Failed"]},
    orderStatus: {type: String, default: "Pending", enum: ["Placed", "Accepted", "Preparing", "Manual", "Cancelled", "Delivered", "Ready", "Out_For_Delivery",]},
    restaurantId: {type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true},
    restaurantCoords: [Number],
    recipientCoords: [Number],
    driverId: {type: String, default: ''},
    rating: {type: Number, min: 1, max: 5, default: 3},
    feedback: {type: String}, 
    PromoCode:{type: String},
    customerName:{type: String, default: ''},
    customerPhone: {type: String, default: ''},
    discountAmount: {type: Number},
    notes: {type: String},
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema)


//  samuelnoye35@gmail.com
//  password123456789
