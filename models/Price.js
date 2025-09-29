// const mongoose = require('mongoose');

// const PriceSchema = new mongoose.Schema({
//     basePrice: { type: Number },
//     serviceFee: {type: Number},
//     time: { type: Date, default: Date.now },
//     oldPrices: [ // Array to store historical prices
//         {
//             price: { type: Number, required: true }, // Old price value
//             time: { type: Date, required: true } // Timestamp when this price was active
//         }
//     ]

// }, {
//     toJSON: {
//         transform(doc, ret) {
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// }
// );

// module.exports = mongoose.model('Price', PriceSchema);


// models/price.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Price = sequelize.define('Price', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true // Corresponds to not being required
  },
  serviceFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW // Sequelize's equivalent of Date.now
  },
  // --- Storing the array of objects as JSON ---
  oldPrices: {
    type: DataTypes.JSON,
    allowNull: true
  },
}, {
  tableName: 'prices',
  timestamps: true,
});

// This model does not have any direct relationships (associations) with other tables
// in this schema, so we don't need any .belongsTo() or .hasMany() calls.

// Synchronize the model with the database (for development)
// sequelize.sync({ alter: true });

module.exports = Price;