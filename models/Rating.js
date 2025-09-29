// const mongoose = require('mongoose');

// const RatingSchema = new mongoose.Schema({
//     restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     rating: { type: Number, min: 1.0, max: 5.0, required: true },
//     name: {type: String, default: ""},
//     comment: { type: String, default: '' }
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('Rating', RatingSchema);





// models/rating.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user'); // Import User model for the relationship
const Restaurant = require('./restaurant'); // Import Restaurant model for the relationship

const Rating = sequelize.define('Rating', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    validate: { // Application-level validation for min/max
      min: 1.0,
      max: 5.0
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ""
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  restaurantId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'restaurants',
      key: 'id'
    }
  }
  // The 'userId' and 'restaurantId' foreign keys are added via associations
}, {
  tableName: 'ratings',
  timestamps: true,
});


module.exports = Rating;