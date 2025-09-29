// const mongoose = require('mongoose');

// const RiderRatingSchema = new mongoose.Schema({
//     riderId: { type: String, default: "" },
//     userId: { type: String, default: "" },
//     orderId: { type: String, default: "" },
//     rating: { type: Number, min: 1.0, max: 5.0, required: true },
//     name: {type: String, default: ""},
//     comment: { type: String, default: '' }
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('RiderRating', RiderRatingSchema);



// models/riderRating.js

// models/riderRating.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
// Best practice: use lowercase filenames e.g., './user'
const User = require('./user'); 
const Order = require("./order");

const RiderRating = sequelize.define('RiderRating', {
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
  riderId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users', // Assuming a rider is also a user
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    validate: {
      min: 1.0,
      max: 5.0
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'rider_ratings',
  timestamps: true
});


module.exports = RiderRating;