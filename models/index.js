// models/index.js
const sequelize = require('../config/database');

// 1. Import all models (ensure filenames are lowercase, e.g., 'address.js')
const User = require('./user');
const Restaurant = require('./restaurant');
const Rider = require('./rider');
const Order = require('./order');
const OrderItem = require('./orderItems'); // Corrected filename to match model
const Address = require('./address');
const Food = require('./food');
const Rating = require('./rating');
const RiderRating = require('./riderRating');
const Cart = require('./cart');
const Additive = require('./additive');
const Pack = require('./pack');
const Category = require('./category');
const Price = require('./price');
const Other = require('./others');


// 2. Define all associations in one place

// --- User Associations ---
User.hasOne(Restaurant, { foreignKey: 'userId', as: 'ownedRestaurant' });
User.hasOne(Rider, { foreignKey: 'userId', as: 'riderProfile' });
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
User.hasMany(Rating, { foreignKey: 'userId', as: 'givenRestaurantRatings' });
User.hasMany(RiderRating, { foreignKey: 'userId', as: 'givenRiderRatings' });
User.hasMany(RiderRating, { foreignKey: 'riderId', as: 'receivedRiderRatings' });
User.hasMany(Cart, { foreignKey: 'userId', as: 'cartItems' });

// --- Restaurant Associations ---
Restaurant.belongsTo(User, { foreignKey: 'userId', as: 'owner' }); // Inverse of User.hasOne
Restaurant.hasMany(Food, { foreignKey: 'restaurantId', as: 'foods' });
Restaurant.hasMany(Rating, { foreignKey: 'restaurantId', as: 'receivedRatings' });
Restaurant.hasMany(Pack, { foreignKey: 'restaurantId', as: 'packs' });
Restaurant.hasMany(Additive, { foreignKey: 'restaurantId', as: 'additives' });

// --- Rider Associations ---
Rider.belongsTo(User, { foreignKey: 'userId', as: 'userProfile' }); // Inverse of User.hasOne

// --- Order Associations ---
Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Order.belongsTo(Address, { foreignKey: 'deliveryAddressId', as: 'deliveryAddress' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Order.hasOne(RiderRating, { foreignKey: 'orderId', as: 'riderRatingDetails' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems' });

// --- OrderItem Associations ---
OrderItem.belongsTo(Order, { foreignKey: 'orderId' }); // Inverse of Order.hasMany
OrderItem.belongsTo(Food, { foreignKey: 'foodId', as: 'food' });

// --- Food Associations ---
Food.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Food.hasMany(Cart, { foreignKey: 'foodId', as: 'cartEntries' });
Food.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Food.hasMany(OrderItem, { foreignKey: 'foodId' }); // Inverse of OrderItem.belongsTo

// --- Cart Associations ---
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Cart.belongsTo(Food, { foreignKey: 'foodId', as: 'food' });

// --- Address Associations ---
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' }); // Inverse of User.hasMany

// --- Rating Associations ---
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Rating.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// --- RiderRating Associations ---
RiderRating.belongsTo(User, { foreignKey: 'userId', as: 'ratingUser' });
RiderRating.belongsTo(User, { foreignKey: 'riderId', as: 'ratedRider' });
RiderRating.belongsTo(Order, { foreignKey: 'orderId', as: 'order' }); // Inverse of Order.hasOne

// --- Pack Associations ---
Pack.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// --- Additive Associations ---
Additive.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });

// --- Category Associations ---
Category.hasMany(Food, { foreignKey: 'categoryId', as: 'foods' });




// 4. Export all models from this central file
module.exports = {
    User,
    Restaurant,
    Rider,
    Order,
    OrderItem, // Added OrderItem
    Address,
    Food,
    Rating,
    RiderRating,
    Cart,
    Additive,
    Pack,
    Category,
    Price,
    Other,
};