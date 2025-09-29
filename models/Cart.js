// const mongoose = require('mongoose');

// const CartSchema = new mongoose.Schema({
//     userId: {type: mongoose.Schema.Types.ObjectId, ref:'User', required:true},
//     foodId: {type: mongoose.Schema.Types.ObjectId, ref:'Food', required:true},
//     additives: {type: Array, required:false, default:[]},
//     totalPrice: {type: Number, required:true},
    
// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v; 
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Cart', CartSchema)


// models/cart.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user'); // Import User model for the relationship
const Food = require('./food'); // Import Food model for the relationship

const Cart = sequelize.define('Cart', {
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
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: { // ADD THIS FIELD
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
   foodId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'foods', key: 'id' }
  },
  // --- Storing array data as JSON ---
  additives: {
    type: DataTypes.JSON,
    allowNull: true // Default is an empty array, so allow NULL and handle in logic
  },
  // The 'userId' and 'foodId' foreign keys are added via associations
}, {
  tableName: 'carts',
  timestamps: true,
});



module.exports = Cart;