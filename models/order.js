// const mongoose = require('mongoose');

// const OrderItemSchema = new mongoose.Schema({
//     foodId: {type: String, required:true},
//     additives: {type: Array},
//     instruction: {type: String, default: ''},
//     numberOfPack: {type: Number, required:true, default: 1}
// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });
// const OrderSchema = new mongoose.Schema({
//     userId: {type: String, required:true},
//     orderItems: [OrderItemSchema],
//     orderTotal: {type: Number, required:true},
//     orderSubId: {type: Number, required:true},
//     deliveryFee: {type: Number, required:true},
//     customerFcm: {type: String, default: ''},
//     restaurantFcm: {type: String, default: ''},
//     riderFcm: {type: String, default: ''},
//     grandTotal: {type: Number, required:true},
//     deliveryAddress: {
//         type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true
//     },
//     restaurantAddress: {
//         type: String,  required: true
//     },
//     paymentMethod: {type: String, required:true},
//     paymentStatus: {type: String, default: "Pending", enum: ["Pending", "Completed", "Failed"]},
//     orderStatus: {type: String, default: "Pending", enum: ["Placed", "Accepted", "Preparing", "Manual", "Cancelled", "Delivered", "Ready", "Out_For_Delivery",]},
//     riderStatus: {type: String, default: "NRA", enum: ["NRA", "RA", "AR", "TDP", "ADP" ,"OD"]},
//     restaurantId: {type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true},
//     restaurantCoords: [Number],
//     recipientCoords: [Number],
//     riderId: {type: String, default: ''},
//     rejectedBy: [{ type: String }],
//     rating: {type: Number, min: 1, max: 5, default: 3},
//     restaurantRating: {type: Boolean, default: false},
//     riderRating: {type: Boolean, default: false},
//     feedback: {type: String}, 
//     PromoCode:{type: String},
//     customerName:{type: String, default: ''},
//     customerPhone: {type: String, default: ''},
//     discountAmount: {type: Number},
//     notes: {type: String},
//     riderAssigned: { type: Boolean, default: false }
// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Order', OrderSchema)


// //  samuelnoye35@gmail.com
// //  password123456789



// models/order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Address = require('./address'); // Assuming you have an Address model
const Restaurant = require('./restaurant'); // Assuming you have a Restaurant model

const Order = sequelize.define('Order', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
userId: {
    type: DataTypes.STRING, // Must match the data type of the User's primary key
    allowNull: false,
    references: {
      model: 'users', // This is the table name
      key: 'id'       // This is the column name in the users table
    }
  },
   deliveryAddressId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'addresses', key: 'id' }
  },
  restaurantId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'restaurants', key: 'id' }
  },
  orderTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  orderSubId: { type: DataTypes.INTEGER, allowNull: false },
  deliveryFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  customerFcm: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
  restaurantFcm: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
  riderFcm: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
  grandTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  restaurantAddress: { type: DataTypes.TEXT, allowNull: false },
  paymentMethod: { type: DataTypes.STRING, allowNull: false },
  paymentStatus: { type: DataTypes.STRING, defaultValue: 'Pending' },
  orderStatus: { type: DataTypes.STRING, defaultValue: 'Pending' },
  riderStatus: { type: DataTypes.STRING, defaultValue: 'NRA' },
  riderId: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
  rating: { type: DataTypes.INTEGER, defaultValue: 3, validate: { min: 1, max: 5 } },
  restaurantRating: { type: DataTypes.BOOLEAN, defaultValue: false },
  riderRating: { type: DataTypes.BOOLEAN, defaultValue: false },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  PromoCode: { type: DataTypes.STRING, allowNull: true },
  customerName: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
  customerPhone: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
  discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  riderAssigned: { type: DataTypes.BOOLEAN, defaultValue: false },

  // --- Storing complex/array data as JSON ---
  restaurantCoords: {
    type: DataTypes.JSON,
    allowNull: true
  },
  recipientCoords: {
    type: DataTypes.JSON,
    allowNull: true
  },
  rejectedBy: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // Foreign keys (userId, deliveryAddressId, restaurantId) are added via associations
}, {
  tableName: 'orders',
  timestamps: true,

  defaultScope: {
    include: [
      {
        association: 'orderItems', // This alias MUST match the one in models/index.js
        include: [{
            association: 'food', // This alias MUST match the one on the OrderItem model
            attributes: ['id', 'title', 'imageUrl', 'price'] 
        }]
      }
    ]
  }
});


module.exports = Order;
