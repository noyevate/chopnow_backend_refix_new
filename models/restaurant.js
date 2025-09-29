// const mongoose = require('mongoose');

// const RestaurantSchema = new mongoose.Schema({
//     title: { type: String, required: true },
//     time: { type: Array, default: [] },
//     imageUrl: { type: String, required: true },
//     foods: { type: Array, default: [] },
//     pickup: { type: Boolean, default: false },
//     restaurantFcm: {type: String, default: false},
//     restaurantMail: {type: String, required: true},
//     delivery: { type: Boolean, default: true },
//     isAvailabe: { type: Boolean, default: true },
//     phone: { type: String, required: true },
//     code: { type: String, required: false },
//     accountName: {type: String, required: false},
//     accountNumber: {type: String, required: false},
//     bank: {type: String, required: false},
//     logoUrl: { type: String, required: true },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
//     rating: { type: Number, min: 1.0, max: 5.0, default: 1.0 },
//     ratingCount: { type: String, default: 267 },
//     verification: { type: String, default: "Pending", enum: ["Pending", "Verified", "Rejected"] },
//     verificationMessage: { type: String, default: "Your restaurant is under review, we will notify you once it is verified" },
//     coords: {
//         id: { type: String },
//         latitude: { type: Number, required: true },
//         longitude: { type: Number, required: true },
//         latitudeDelta: { type: Number, default: 0.0122 },
//         longitudeDelta: { type: Number, default: 0.0122 },
//         address: { type: String, required: true },
//         title: { type: String, required: true },
//     },
//     restaurant_categories: [{
//         name: { type: String, required: false },
//         additives: { type: Array, default: [] }
//     }]
// }, {
//     toJSON: {
//         transform(doc, ret) {
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Restaurant', RestaurantSchema);


// models/restaurant.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user'); // Assuming the owner is a user

const Restaurant = sequelize.define('Restaurant', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  title: { type: DataTypes.STRING, allowNull: false },
  imageUrl: { type: DataTypes.STRING, allowNull: false },
  pickup: { type: DataTypes.BOOLEAN, defaultValue: false },
  restaurantFcm: { type: DataTypes.STRING, allowNull: true },
  restaurantMail: { type: DataTypes.STRING, allowNull: false },
  delivery: { type: DataTypes.BOOLEAN, defaultValue: true },
  isAvailabe: { type: DataTypes.BOOLEAN, defaultValue: true }, // Matched typo
  phone: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: true },
  accountName: { type: DataTypes.STRING, allowNull: true },
  accountNumber: { type: DataTypes.STRING, allowNull: true },
  bank: { type: DataTypes.STRING, allowNull: true },
  logoUrl: { type: DataTypes.STRING, allowNull: false },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 1.0,
    validate: { min: 1.0, max: 5.0 }
  },
  ratingCount: { type: DataTypes.STRING, defaultValue: '267' },
  verification: { type: DataTypes.STRING, defaultValue: "Pending" },
  verificationMessage: { type: DataTypes.TEXT, defaultValue: "Your restaurant is under review, we will notify you once it is verified" },

  // --- Flattened 'coords' object ---
  latitude: { type: DataTypes.DOUBLE, allowNull: false },
  longitude: { type: DataTypes.DOUBLE, allowNull: false },
  latitudeDelta: { type: DataTypes.DOUBLE, defaultValue: 0.0122 },
  longitudeDelta: { type: DataTypes.DOUBLE, defaultValue: 0.0122 },
  address: { type: DataTypes.TEXT, allowNull: false },
  addressTitle: { type: DataTypes.STRING, allowNull: false }, // Renamed

  // --- Storing complex/array data as JSON ---
  time: {
    type: DataTypes.JSON,
    allowNull: true
  },

  userId: {
    type: DataTypes.STRING, // Must match the data type of the User's primary key
    allowNull: false,
    references: {
      model: 'users', // This is the table name
      key: 'id'       // This is the column name in the users table
    }
  },

  restaurant_categories: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // Foreign key (userId) is added via association
}, {
  tableName: 'restaurants',
  timestamps: true,
});


module.exports = Restaurant;
