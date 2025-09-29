// const mongoose = require('mongoose');

// const AddressSchema = new mongoose.Schema({
//     userId: {type: String, required:true},
//     addressLine1: {type: String, required:true},
//     postalCode: {type: String, required:true},
//     default: {type: Boolean, default: false},
//     deliveryInstructions: {type: String, required: false},
//     latitude: {type: Number, required:false},
//     longitude: {type: Number, required:false}
// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Address', AddressSchema)


// models/address.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user'); // Import the User model to define the relationship

const Address = sequelize.define('Address', {
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
 
  addressLine1: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // --- IMPORTANT: Renamed from 'default' to 'isDefault' ---
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'isDefault' // Explicitly maps this model field to the 'isDefault' column
  },
  deliveryInstructions: {
    type: DataTypes.STRING, // VARCHAR(255) is usually enough for instructions
    allowNull: true
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
}, {
  tableName: 'addresses',
  timestamps: true,
});


module.exports = Address;