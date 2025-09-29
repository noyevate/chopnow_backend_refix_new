// const mongoose = require('mongoose');

// const AdditiveSchema = new mongoose.Schema({
//     restaurantId: { type: String, required: true },
//     additiveTitle: { type: String, required: true },


//     options: {type: Array, default:[]},
//     max: { type: Number, required: false },
//     min: { type: Number, required: false },
//     isAvailable: { type: Boolean, default: true }
// }, {
//     toJSON: {
//         transform(doc, ret) {
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Additives', AdditiveSchema);


// models/additive.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant'); // Import the Restaurant model for the relationship

const Additive = sequelize.define('Additive', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  additiveTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },

  
  max: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
min: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // --- Storing array data as JSON ---
  options: {
    type: DataTypes.JSON,
    allowNull: true
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
  tableName: 'additives',
  timestamps: true,
});



module.exports = Additive;