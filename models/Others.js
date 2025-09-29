// const mongoose = require('mongoose');

// const OtherSchma = new mongoose.Schema({
//     minLat: {type: Number, default: 0.05},
//     maxLat: {type: Number, default: 0.05},
//     minLng: {type: Number, default: 0.05},
//     maxLng: {type: Number, default: 0.05},
    
// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Other', OtherSchma)



// models/other.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import the connection instance

const Other = sequelize.define('Other', {
  // id, createdAt, updatedAt are created automatically
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  minLat: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0.05
  },
  maxLat: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0.05
  },
  minLng: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0.05
  },
  maxLng: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0.05
  },
}, {
  tableName: 'others',  // The actual table name in the database
  timestamps: true,      // Enables createdAt and updatedAt fields
});

// This model is standalone and has no relationships (associations)
// with other tables in this schema.

// Synchronize the model with the database (for development)
// sequelize.sync({ alter: true });

module.exports = Other;