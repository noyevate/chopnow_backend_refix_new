// const mongoose = require('mongoose');

// const FoodSchema = new mongoose.Schema({
//     title: {type: String, required:true},
//     time: {type: String, required:true},
//     foodTags: {type: Array, required:true},
//     category: {type: String, required:true},
//     foodType: {type: Array, required:true},
//     code: {type: String, required:true},
//     isAvailable: {type: Boolean, default:true},
//     restaurant: {type: mongoose.Schema.Types.ObjectId, required:true},
//     rating: {type: Number, min:1, max:5, default:3},
//     ratingCount: {type: String, default: 267},
//     description: {type: String, required:true},
//     price: {type: Number, required:true},
//     priceDescription: {type: String, required:false},
//     additive: {type: Array, default:[]},
//     pack: {type: Array, default:[]},
//     imageUrl: {type: Array, required:true},
//     restaurant_category: {type: String, required:true},
//     restaurantCategoryAvailable: {type: Boolean, default:true},

// },{
//     toJSON: {
//         transform(doc, ret){
//             delete ret.__v;
//         }
//     },
//     timestamps: true
// });

// module.exports = mongoose.model('Food', FoodSchema)

// // [
// //     _id: "k38834u34fh324r9234"
// //     restaurant_category: "main Course",
// //     restaurantCategoryAvailable: true,
// //     items: [
// //          remaining field of the schema
// //     ]

// // ]


// models/food.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Restaurant = require('./restaurant'); // Import the Restaurant model for the relationship
const Category = require('./Category');

const Food = sequelize.define('Food', {
  // id, createdAt, updatedAt are automatic
  id: {
  type: DataTypes.STRING,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false
},
  title: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 3.0,
    validate: { min: 1, max: 5 }
  },
  ratingCount: { type: DataTypes.STRING, defaultValue: '267' },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  priceDescription: { type: DataTypes.STRING, allowNull: true },
  restaurant_category: { type: DataTypes.STRING, allowNull: false },
  restaurantCategoryAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },

  // --- Storing array data as JSON ---
  foodTags: {
    type: DataTypes.JSON,
    allowNull: false
  },
  foodType: {
    type: DataTypes.JSON,
    allowNull: false
  },
  additive: {
    type: DataTypes.JSON,
    allowNull: true
  },
  pack: {
    type: DataTypes.JSON,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.JSON,
    allowNull: false
  },
   restaurantId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'restaurants', // Table name
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'categories', // This is the table name
      key: 'id'           // This is the column name in the categories table
    }
  }

  // The 'restaurantId' foreign key is added via the association below
}, {
  tableName: 'foods',
  timestamps: true,
});



module.exports = Food;