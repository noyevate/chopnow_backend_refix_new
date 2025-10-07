// controllers/ratingController.js
const {Rating, Restaurant, Order} = require("../models");

// Import the sequelize instance to create a transaction
const sequelize = require('../config/database'); 
const logger = require('../utils/logger')

// In your ratingController.js

async function addRating(req, res) {
    const { restaurantId, userId, rating, comment, name, orderId } = req.body;
    const controllerName = 'addRating';

    try {
        logger.info(`Attempting to add rating for order.`, { controller: controllerName, orderId, userId });

        const newRating = await sequelize.transaction(async (t) => {
            if (!orderId || rating === undefined || !restaurantId || !userId) {
                throw new Error("Missing required fields: orderId, rating, restaurantId, or userId.");
            }

            const orderToUpdate = await Order.findByPk(orderId, { transaction: t });
            if (!orderToUpdate) {
                throw new Error("Order not found.");
            }
            if (orderToUpdate.restaurantRating === true) {
                throw new Error("This order has already been rated.");
            }

            const createdRating = await Rating.create({
                restaurantId, userId, rating, comment, name
            }, { transaction: t });

            // --- THIS IS THE FIX ---
            // 1. Pass the transaction correctly as part of the options object.
            const allRatings = await Rating.findAll({
                where: { restaurantId: restaurantId },
                transaction: t // <-- Correct placement
            });
            // --- END FIX ---

            if (allRatings.length > 0) {
                const totalRating = allRatings.reduce((acc, rate) => acc + parseFloat(rate.rating), 0);
                // 2. Calculate as a number first, then format for the database
                const avgRatingValue = totalRating / allRatings.length;

                await Restaurant.update({
                    rating: avgRatingValue, // Pass the raw number
                    ratingCount: allRatings.length.toString()
                }, {
                    where: { id: restaurantId },
                    transaction: t
                });
            }
            
            await orderToUpdate.update({ restaurantRating: true }, { transaction: t });
            
            return createdRating;
        });

        res.status(201).json(newRating);

    } catch (err) {
        // The managed transaction has already rolled back.
        logger.error(`Failed to add rating: ${err.message}`, { controller: controllerName, error: err.stack });
        const statusCode = err.message.includes("not found") || err.message.includes("already rated") ? 400 : 500;
        res.status(statusCode).json({ status: false, message: "Failed to add rating.", error: err.message });
    }
};

async function getRestaurantRatings(req, res) {
    // The Mongoose version was named getRestaurant, but this is more descriptive.
    const { restaurantId } = req.params; // Changed to req.params for REST standard

    if (!restaurantId) {
        return res.status(400).json({ status: false, message: 'Restaurant ID is required.' });
    }

    try {
        const ratings = await Rating.findAll({
            where: { restaurantId: restaurantId }
        });
        
        // It's standard to return an empty array if no ratings are found.
        res.status(200).json(ratings);

    } catch (err) {
        res.status(500).json({ status: false, message: "Failed to get ratings.", error: err.message });
    }
}

async function checkUserRating(req, res) {
    // This function checks if a specific user has rated a specific restaurant.
    const { userId, restaurantId } = req.body;

    try {
        const existingRating = await Rating.findOne({
            where: {
                userId: userId,
                restaurantId: restaurantId
            }
        });

        if (existingRating) {
            res.status(200).json({ status: true, message: "You have already rated this restaurant." });
        } else {
            res.status(200).json({ status: false, message: "Not rated yet." });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to check rating.", error: error.message });
    }
}

module.exports = { addRating, checkUserRating, getRestaurantRatings };