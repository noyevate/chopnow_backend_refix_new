const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
    title: {type: String, required:true},
    time: {type: String, required:true},
    foodTags: {type: Array, required:true},
    category: {type: String, required:true},
    foodType: {type: Array, required:true},
    code: {type: String, required:true},
    isAvailable: {type: Boolean, default:true},
    restaurant: {type: mongoose.Schema.Types.ObjectId, required:true},
    rating: {type: Number, min:1, max:5, default:3},
    ratingCount: {type: String, default: 267},
    description: {type: String, required:true},
    price: {type: Number, required:true},
    priceDescription: {type: String, required:false},
    additive: {type: Array, default:[]},
    pack: {type: Array, default:[]},
    imageUrl: {type: Array, required:true},
    restaurant_category: {type: String, required:true},
    restaurantCategoryAvailable: {type: Boolean, default:true},

},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Food', FoodSchema)

// [
//     _id: "k38834u34fh324r9234"
//     restaurant_category: "main Course",
//     restaurantCategoryAvailable: true,
//     items: [
//          remaining field of the schema
//     ]

// ]









// const FoodSchema = new mongoose.Schema({
//     restaurant_category: {type: String, required:true},
//     items: [
//         title: {type: String, required:true},
//         time: {type: String, required:true},
//         foodTags: {type: Array, required:true},
//         category: {type: String, required:true},
//         foodType: {type: Array, required:true},
//         code: {type: String, required:true},
//         isAvailable: {type: Boolean, default:true},
//         restaurant: {type: mongoose.Schema.Types.ObjectId, required:true},
//         rating: {type: Number, min:1, max:5, default:3},
//         ratingCount: {type: String, default: 267},
//         description: {type: String, required:true},
//         price: {type: Number, required:true},
//         priceDescription: {type: String, required:false},
//         additive: {type: Array, default:[]},
//         pack: {type: Array, default:[]},
//         imageUrl: {type: Array, required:true},
//     ]

// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Food', FoodSchema)
