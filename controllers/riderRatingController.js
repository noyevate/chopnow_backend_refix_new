const Rating = require("../models/RiderRating");
const Rider = require("../models/Rider");
const Order = require("../models/Order");
const pushNotificationController = require("./pushNotificationController")

async function rateRider(req, res) {
    const { riderId, userId, orderId, rating, comment, name } = req.body;
    const {customerFcm} = req.params

    try {

        const existingRating = await Rating.findOne({ orderId });
        const order = await Order.findById(orderId)
        console.log(order)

        if (existingRating) {
            return res.status(400).json({ status: false, message: "You have already rated this rider for this order." });
        }

        const newRating = new Rating({
            riderId: riderId,
            orderId: orderId,
            userId: userId,
            rating,
            comment,
            name,
        });

        await newRating.save();

        try {
            const ratings = await Rating.find({ riderId }); // Fetch all ratings for this rider
            const totalRating = ratings.reduce((acc, rate) => acc + rate.rating, 0);
            const avgRating = (totalRating / ratings.length).toFixed(1);
            const rider = await Rider.findOne({ userId: riderId })
            rider.rating = avgRating
            rider.ratingCount = ratings.length
            rider.save()
            await Order.findByIdAndUpdate(orderId, {restaurantRating: true})
            await pushNotificationController.sendPushNotification(customerFcm,
                "New Rating Received ⭐",
                "You've just received a new rating! Check your profile to see your updated score.", order);
            await pushNotificationController.sendPushNotification(order.riderFcm,
                "New Rating Received ⭐",
                "You've just received a new rating!", order);
        } catch (error) {
            console.log(error)
        }





        res.status(201).send(newRating);
    } catch (err) {
        res.status(500).send(err);
    }
};

async function fetchRatingByOrderId(req, res) {
    const { orderId, riderId } = req.params;

    try {
        if (!orderId || !riderId) {
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        const rating = await Rating.findOne({ orderId, riderId });

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
        const ratings = await Rating.find({ riderId });

        if (ratings.length === 0) {
            return res.status(404).json({ status: false, message: "No ratings found for this rider." });
        }

        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}

async function deleteRiderRating(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ status: false, message: " ID is required." });
        }

        // Find all ratings for the given riderId
        const ratings = await Rating.findByIdAndDelete({ id });

        if (ratings.length === 0) {
            return res.status(404).json({ status: false, message: "No ratings found for this rider." });
        }

        res.status(200).json({ message: "rating deleted" });
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
}



module.exports = { rateRider, fetchRatingByOrderId, getRatingsByRider, deleteRiderRating }