// Import the new Sequelize models
const {RiderRating, Rider, Order, User} = require("../models"); // Corrected model name
const logger = require('../utils/logger');


// Import the sequelize instance to create a transaction
const sequelize = require("../config/database"); 

const pushNotificationController = require("./pushNotificationController");

async function rateRider(req, res) {
    const { riderId, userId, orderId, rating, comment, name } = req.body;
    const controllerName = 'rateRider';

    try {
        logger.info(`Attempting to rate rider for order.`, { controller: controllerName, riderId, orderId, userId });

        const newRating = await sequelize.transaction(async (t) => {
            // --- VALIDATION ---
            if (!riderId || !userId || !orderId || rating === undefined) {
                throw new Error("Missing required fields: riderId, userId, orderId, or rating.");
            }

            const existingRating = await RiderRating.findOne({
                where: { orderId: orderId },
                transaction: t // Pass transaction correctly
            });
            if (existingRating) {
                throw new Error("This order has already been rated for a rider.");
            }

            // --- DATABASE WRITES ---
            
            // 1. Create the new rider rating
            const createdRating = await RiderRating.create({
                riderId, userId, orderId, rating, comment, name
            }, { transaction: t });

            // 2. Recalculate and update the Rider's average rating
            const allRatingsForRider = await RiderRating.findAll({
                where: { riderId: riderId },
                transaction: t // Pass transaction correctly
            });
            
            if (allRatingsForRider.length > 0) {
                const totalRating = allRatingsForRider.reduce((acc, rate) => acc + parseFloat(rate.rating), 0);
                const avgRatingValue = totalRating / allRatingsForRider.length;

                await Rider.update({
                    rating: avgRatingValue, // Pass the raw number
                    ratingCount: allRatingsForRider.length
                }, {
                    where: { id: riderId }, // Find the Rider by their profile ID
                    transaction: t
                });
            }

            // 3. Update the order to mark that the rider has been rated
            await Order.update(
                { riderRating: true },
                { where: { id: orderId }, transaction: t }
            );

            return createdRating;
        });

        // --- Post-Transaction Side Effects (Notifications) ---
        try {
            const order = await Order.findByPk(orderId);
            if (order && order.riderFcm) {
                // Assuming customerFcm is also on the order or passed in body
                const customerFcm = order.customerFcm; 
                await pushNotificationController.sendPushNotification(customerFcm, "Rider Rated ⭐", "You've just given the rider a new rating.", order);
                await pushNotificationController.sendPushNotification(order.riderFcm, "New Rating Received ⭐", "You've just received a new rating!", order);
            }
        } catch (pushError) {
            logger.error(`Push notification failed after rating rider: ${pushError.message}`, { controller: controllerName });
        }

        res.status(201).json(newRating);

    } catch (err) {
        // The managed transaction has already rolled back.
        logger.error(`Failed to rate rider: ${err.message}`, { controller: controllerName, error: err.stack });
        const statusCode = err.message.includes("not found") || err.message.includes("already rated") ? 400 : 500;
        res.status(statusCode).json({ status: false, message: "Failed to rate rider.", error: err.message });
    }
};

async function fetchRatingByOrderId(req, res) {
    const { orderId, riderId } = req.params;

    try {
        if (!orderId || !riderId) {
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        const rating = await RiderRating.findOne({
            where: {
                orderId: orderId,
                riderId: riderId
            }
        });

        if (!rating) {
            return res.status(404).json({ status: false, message: "Rating not found." });
        }

        res.status(200).json(rating);

    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

async function getRatingsByRider(req, res) {
    try {
        const { riderId } = req.params;

        if (!riderId) {
            return res.status(400).json({ status: false, message: "Rider ID is required." });
        }

        // Find all ratings for the given riderId
        const ratings = await RiderRating.findAll({
            where: { riderId: riderId }
        });

        if (!ratings || ratings.length === 0) {
            return res.status(404).json({ status: false, message: "No ratings found for this rider." });
        }

        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

async function deleteRiderRating(req, res) {
    try {
        const { id } = req.params; // This is the PRIMARY KEY of the rating itself

        if (!id) {
            return res.status(400).json({ status: false, message: "Rating ID is required." });
        }

        // Destroy (delete) the rating where the id matches
        const deletedCount = await RiderRating.destroy({
            where: { id: id }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ status: false, message: "No rating found with this ID." });
        }

        res.status(200).json({ status: true, message: "Rating deleted successfully." });
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

module.exports = { rateRider, fetchRatingByOrderId, getRatingsByRider, deleteRiderRating };