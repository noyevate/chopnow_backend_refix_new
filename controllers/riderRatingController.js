// Import the new Sequelize models
const {RiderRating, Rider, Order, User} = require("../models"); // Corrected model name


// Import the sequelize instance to create a transaction
const sequelize = require("../config/database"); 

const pushNotificationController = require("./pushNotificationController");

async function rateRider(req, res) {
    // We'll use a transaction to ensure all database operations succeed or none do.
    const t = await sequelize.transaction();

    try {
        const { riderId, userId, orderId, rating, comment, name } = req.body;
        const { customerFcm } = req.params;

        // 1. Check if a rating for this order already exists
        const existingRating = await RiderRating.findOne({
            where: { orderId: orderId } 
        }, { transaction: t });

        if (existingRating) {
            await t.rollback(); // Abort the transaction
            return res.status(400).json({ status: false, message: "You have already rated this rider for this order." });
        }

        // 2. Create the new rating within the transaction
        const newRating = await RiderRating.create({
            riderId, // These are now INTs
            orderId, // These are now INTs
            userId,  // These are now INTs
            rating,
            comment,
            name,
        }, { transaction: t });

        // 3. Recalculate and update the Rider's average rating
        const allRatingsForRider = await RiderRating.findAll({
            where: { riderId: riderId }
        }, { transaction: t });

        const totalRating = allRatingsForRider.reduce((acc, rate) => acc + parseFloat(rate.rating), 0);
        const avgRating = (totalRating / allRatingsForRider.length).toFixed(1);

        // Find the rider's profile (which is linked to a user) and update it
        await Rider.update({
            rating: avgRating,
            ratingCount: allRatingsForRider.length
        }, {
            where: { userId: riderId }, // The Rider model is identified by the userId
            transaction: t
        });

        // 4. Update the order to mark that the rider has been rated
        await Order.update(
            { riderRating: true }, // Changed from restaurantRating to riderRating for logical consistency
            { where: { id: orderId }, transaction: t }
        );

        // 5. If everything above was successful, commit the transaction
        await t.commit();

        // 6. Send push notifications (outside the transaction)
        try {
            const order = await Order.findByPk(orderId); // Refetch the order to get riderFcm
            if (order) {
                 await pushNotificationController.sendPushNotification(customerFcm,
                    "Rider Rated ⭐",
                    "You've just given the rider a new rating.", order);
                 await pushNotificationController.sendPushNotification(order.riderFcm,
                    "New Rating Received ⭐",
                    "You've just received a new rating!", order);
            }
        } catch (pushError) {
            console.log("Push notification failed after rating:", pushError);
        }

        res.status(201).json(newRating);

    } catch (err) {
        await t.rollback(); // If any step fails, roll back all changes
        console.error("Error in rateRider:", err);
        res.status(500).json({ status: false, message: "Failed to rate rider.", error: err.message });
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