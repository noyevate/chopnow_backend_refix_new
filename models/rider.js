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
  },
   recipientCode: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // userId Foreign Key is added via association
}, {
  tableName: 'riders',
  timestamps: true,
});


module.exports = Rider;