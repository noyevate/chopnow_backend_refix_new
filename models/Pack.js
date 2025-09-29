// const mongoose = require('mongoose');

// const PackSchema = new mongoose.Schema({
//     restaurantId: { type: String, required: true },
//     packName: { type: String, required: true },
//     packDescription: { type: String, required: false },
//     price: { type: Number, required: false },
//     isAvailable: { type: Boolean, default: true }
// }, {
//     toJSON: {
//         transform(doc, ret) {
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Pack', PackSchema);



// models/pack.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant'); // Import the Restaurant model for the relationship

const Pack = sequelize.define('Pack', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  packName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  packDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  restaurantId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'restaurants',
      key: 'id'
    }
  }
  // The 'restaurantId' foreign key is added via the association below
}, {
  tableName: 'packs',
  timestamps: true,
});



module.exports = Pack;