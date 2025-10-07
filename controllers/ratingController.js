// controllers/ratingController.js
const {Rating, Restaurant, Order} = require("../models");

// Import the sequelize instance to create a transaction
const sequelize = require('../config/database'); 

// In your ratingController.js

async function addRating(req, res) {
    const { restaurantId, userId, rating, comment, name, orderId } = req.body;
    const controllerName = 'addRating';

    // Use a managed transaction for cleaner error handling
    try {
        logger.info(`Attempting to add rating for order.`, { controller: controllerName, orderId, userId });

        const result = await sequelize.transaction(async (t) => {
            // --- VALIDATION ---
            if (!orderId || !rating || !restaurantId || !userId) {
                // Throwing an error inside a managed transaction automatically triggers a rollback
                throw new Error("Missing required fields: orderId, rating, restaurantId, or userId.");
            }

            const orderToUpdate = await Order.findByPk(orderId, { transaction: t });
            if (!orderToUpdate) {
                throw new Error("Order not found.");
            }
            if (orderToUpdate.restaurantRating === true) {
                throw new Error("This order has already been rated.");
            }

            // --- DATABASE WRITES ---
            
            // 1. Create the new rating
            const newRating = await Rating.create({
                restaurantId,
                userId,
                rating,
                comment,
                name
            }, { transaction: t });

            // 2. Recalculate and update the restaurant's average rating
            const allRatings = await Rating.findAll({
                where: { restaurantId: restaurantId }
            }, { transaction: t });

            const totalRating = allRatings.reduce((acc, rate) => acc + parseFloat(rate.rating), 0);
            const avgRating = (totalRating / allRatings.length).toFixed(1);

            await Restaurant.update({
                rating: avgRating,
                ratingCount: allRatings.length.toString()
            }, {
                where: { id: restaurantId },
                transaction: t
            });
            
            // 3. Update the order using the instance we already found
            await orderToUpdate.update({ restaurantRating: true }, { transaction: t });

            return newRating; // Return the created rating on success
        });

        res.status(201).json(result);

    } catch (err) {
        // The managed transaction has already been rolled back.
        logger.error(`Failed to add rating: ${err.message}`, { controller: controllerName, error: err.stack });
        // Send a more specific error code if possible
        const statusCode = err.message.includes("not found") || err.message.includes("already been rated") ? 404 : 500;
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