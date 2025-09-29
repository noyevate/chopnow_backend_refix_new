// const mongoose = require('mongoose');

// const RiderSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
//     vehicleImgUrl: { type: String, required: true },
//     vehicleType: { type: String, required: true },
//     fcm: {type: String, default: ""},
//     vehicleBrand: { type: String, required: true },
//     plateNumber: { type: String, required: true },
//     guarantors: { type: Array, default: [] },
//     bankName: { type: String, required: true },
//     bankAccount: { type: String, required: true },
//     bankAccountName: { type: String, required: true },
//     workDays: {
//         morningShifts: { type: Array, default: [] },
//         afternoonShift: { type: Array, default: [] },
//     },
//     userImageUrl: { type: String, required: true },
//     particularsImageUrl:{ type: String, required: false, default:"" },
//     driverLicenseImageUrl:{ type: String, required: false, default:""},
//     rating: { type: Number, min: 1.0, max: 5.0, default: 3.0 },
//     ratingCount: { type: Number, default: 267 },
//     verification: { type: String, default: "Pending", enum: ["Pending", "Verified", "Rejected"] },
//     verificationMessage: { type: String, default: "Your restaurant is under review, we will notify you once it is verified" },
//     coords: {

//         latitude: { type: Number, required: true },
//         longitude: { type: Number, required: true },
//         latitudeDelta: { type: Number, default: 0.0122 },
//         longitudeDelta: { type: Number, default: 0.0122 },
//         postalCode: { type: Number, required: true },
//         title: { type: String, required: true },
//     },

// }, {
//     toJSON: {
//         transform(doc, ret) {
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Rider', RiderSchema);


// models/rider.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Rider = sequelize.define('Rider', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  vehicleImgUrl: { type: DataTypes.STRING, allowNull: false },
  vehicleType: { type: DataTypes.STRING, allowNull: false },
  fcm: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
  vehicleBrand: { type: DataTypes.STRING, allowNull: false },
  plateNumber: { type: DataTypes.STRING, allowNull: false },
  bankName: { type: DataTypes.STRING, allowNull: false },
  bankAccount: { type: DataTypes.STRING, allowNull: false },
  bankAccountName: { type: DataTypes.STRING, allowNull: false },
  userImageUrl: { type: DataTypes.STRING, allowNull: false },
  particularsImageUrl: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
  driverLicenseImageUrl: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 3.0,
    validate: { min: 1.0, max: 5.0 }
  },
  ratingCount: { type: DataTypes.INTEGER, defaultValue: 267 },
  verification: { type: DataTypes.STRING, defaultValue: "Pending" },
  verificationMessage: { type: DataTypes.TEXT, defaultValue: "Your restaurant is under review, we will notify you once it is verified" },
  
  // Flattened 'coords'
  latitude: { type: DataTypes.DOUBLE, allowNull: false },
  longitude: { type: DataTypes.DOUBLE, allowNull: false },
  latitudeDelta: { type: DataTypes.DOUBLE, defaultValue: 0.0122 },
  longitudeDelta: { type: DataTypes.DOUBLE, defaultValue: 0.0122 },
  postalCode: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },

  // --- THE PRAGMATIC FIX ---
  // Store the array and object directly as JSON
  guarantors: {
    type: DataTypes.JSON,
    allowNull: true
  },
  workDays: {
    type: DataTypes.JSON,
    allowNull: true
  },
   userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Enforces the one-to-one relationship
    references: {
      model: 'users',
      key: 'id'
    }
  }

  // userId Foreign Key is added via association
}, {
  tableName: 'riders',
  timestamps: true,
});


module.exports = Rider;