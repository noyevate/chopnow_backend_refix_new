const mongoose = require('mongoose');

const AdditiveSchema = new mongoose.Schema({
    restaurantId: { type: String, required: true },
    additiveTitle: { type: String, required: true },


    options: {type: Array, default:[]},
    max: { type: Number, required: false },
    min: { type: Number, required: false },
    isAvailable: { type: Boolean, default: true }
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('Additives', AdditiveSchema);


// const mongoose = require('mongoose');

// // Define a schema for the options array
// const AdditiveOptionSchema = new mongoose.Schema({
//   additiveName: { type: String, required: true },
//   price: { type: Number, required: true },
//   isAvailable: { type: Boolean, default: true }
// });

// // Main schema for the Additives model
// const AdditiveSchema = new mongoose.Schema({
//   restaurantId: { type: String, required: true },
//   additiveTitle: { type: String, required: true },
  
//   // Define the options array as an array of AdditiveOptionSchema
//   options: { type: [AdditiveOptionSchema], default: [] },
  
//   max: { type: Number, required: false },
//   min: { type: Number, required: false },
//   isAvailable: { type: Boolean, default: true }
// }, {
//   toJSON: {
//     transform(doc, ret) {
//       delete ret.__v;
//     }
//   },
//   timestamps: true
// });

// module.exports = mongoose.model('Additives', AdditiveSchema);
