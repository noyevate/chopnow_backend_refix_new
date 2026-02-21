// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//     first_name: {type: String, required:false},
//     last_name: {type: String, required:false},
//     username: {type: String, required:false},
//     email: {type: String, required:true},
//     otp: {type: String, required:false, default:'none'},
//     fcm:{type: String, required:false, default:"none"},
//     password: {type: String, required:false, default: "non"},
//     pin: {type: String, required:false, default: "none"}, // New field for storing hashed PINs
//     otpExpires: {type: Date},
//     verification: {type: Boolean, default:false},
//     phone: {type: String, default:"08034256783"},
//     phoneVerification: {type: Boolean, default:false},
//     address:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Address",
//         required: false,
//     },
//     userType: {type: String, required:true, default: "Client", enum: ['Client', 'Admin', 'Vendor', 'Rider']},
//     profile: {type: String}

    
// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('User', UserSchema)

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database');

const User =  sequelize.define('User', {

  id: {
    type: DataTypes.STRING,    // Use STRING for UUIDs
    defaultValue: DataTypes.UUIDV4, // Sequelize can auto-generate UUIDs
    primaryKey: true,
    allowNull: false
  },
    first_name: {
    type: DataTypes.STRING,
    allowNull: true // required:false becomes allowNull:true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false, // required:true becomes allowNull:false
    unique: true      // This ensures no two users can have the same email
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'none' // 'default' becomes 'defaultValue'
  },
  fcm: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'none'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'none'
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'none'
  },
  otpExpires: {
    type: DataTypes.DATE, // Mongoose's Date maps to Sequelize's DATE
    allowNull: true
  },
  verification: {
    type: DataTypes.BOOLEAN, // Mongoose's Boolean maps to Sequelize's BOOLEAN
    defaultValue: false
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: "08034256783"
  },
  phoneVerification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Client"
    // Note: The 'enum' constraint should be handled by a database-level ENUM or application-level validation.
    // For simplicity, we'll rely on application logic to enforce the ['Client', 'Admin', 'Vendor', 'Rider'] values.
  },
  profile: {
    type: DataTypes.STRING,
    allowNull: true
  }
  // The 'address' field (foreign key) will be added when we define associations.

}, {
  // --- Model Options ---
  tableName: 'users', // Explicitly tell Sequelize the name of the table in the database
  timestamps: true,   // This enables the automatic 'createdAt' and 'updatedAt' fields
   paranoid: true,
});

// 4. Synchronize the model with the database (for development)
// This line will create the table if it doesn't exist.
// For production, it's better to use migrations.
// sequelize.sync({ alter: true }).then(() => {
//   console.log('User table has been successfully created or updated.');
// }).catch(error => {
//   console.error('Unable to create or update User table:', error);
// });

module.exports = User