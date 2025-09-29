// controllers/ratingController.js
const {Rating, Restaurant, Order} = require("../models");

// Import the sequelize instance to create a transaction
const sequelize = require('../config/database'); 

async function addRating(req, res) {
    // A transaction ensures that the rating is created AND the restaurant's
    // average is updated, or neither operation happens.
    const t = await sequelize.transaction();

    try {
        const { restaurantId, userId, rating, comment, name, orderId } = req.body;

        // Optional but good practice: check if a rating for this order already exists
        // to prevent duplicate ratings from the same order.
        const order = await Order.findByPk(orderId, { transaction: t });
        if (order && order.restaurantRating === true) {
            await t.rollback();
            return res.status(400).json({ status: false, message: "This order has already been rated." });
        }
        
        // Create the new rating within the transaction
        const newRating = await Rating.create({
            restaurantId: restaurantId,
            userId: userId,
            rating,
            comment,
            name
        }, { transaction: t });

        // Recalculate the average rating for the restaurant
        const allRatings = await Rating.findAll({
            where: { restaurantId: restaurantId }
        }, { transaction: t });

        const totalRating = allRatings.reduce((acc, rate) => acc + parseFloat(rate.rating), 0);
        const avgRating = (totalRating / allRatings.length).toFixed(1);

        // Update the restaurant's rating and ratingCount
        await Restaurant.update({
            rating: avgRating,
            ratingCount: allRatings.length.toString() // Keep as string to match model
        }, {
            where: { id: restaurantId },
            transaction: t
        });
        
        // Update the order to mark that the restaurant has been rated
        await Order.update(
            { restaurantRating: true },
            { where: { id: orderId }, transaction: t }
        );

        // If all operations were successful, commit the transaction
        await t.commit();

        res.status(201).json(newRating);

    } catch (err) {
        // If any operation fails, roll back all previous changes in the transaction
        await t.rollback();
        res.status(500).json({ status: false, message: "Failed to add rating.", error: err.message });
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