// const mongoose = require('mongoose');

// const CategorySchema = new mongoose.Schema({
//     title: {type: String, required:true},
//     value: {type: String, required:true},
//     imageUrl: {type: String, required:true}
// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Category', CategorySchema)



// models/category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import the connection instance

const Category = sequelize.define('Category', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},

  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'categories', // The actual table name in the database
  timestamps: true,       // Enable createdAt and updatedAt fields
});

// Synchronize the model with the database (for development)
// sequelize.sync({ alter: true });

module.exports = Category;