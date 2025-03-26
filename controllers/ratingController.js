const Rating = require("../models/Rating");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");


async function addRating (req, res) {
    const { restaurantId, userId, rating, comment, name, orderId } = req.body;

    try {
        const newRating = new Rating({
            restaurant: restaurantId,
            user: userId,
            rating,
            comment,
            name
        });

        await newRating.save();

        // Recalculate the average rating
        const ratings = await Rating.find({ restaurant: restaurantId });
        const totalRating = ratings.reduce((acc, rate) => acc + rate.rating, 0);
        const avgRating = (totalRating / ratings.length).toFixed(1);

        await Restaurant.findByIdAndUpdate(restaurantId, { rating: avgRating, ratingCount: ratings.length });
        await Order.findByIdAndUpdate(orderId, {restaurantRating: true})
        

        res.status(201).send(newRating);
    } catch (err) {
        res.status(500).send(err);
    }
};

async function getRestaurant(req, res) {
    const { restaurantId } = req.query;  // Extract restaurantId from req.query

    if (!restaurantId) {
        return res.status(400).send({ message: 'Restaurant ID is required.' });
    }

    try {
        const ratings = await Rating.find({ restaurant: restaurantId });
        if (ratings.length === 0) {
            return res.status(404).send({ message: 'No ratings found for this restaurant.' });
        }
        res.send(ratings);
    } catch (err) {
        res.status(500).send(err);
    }
}


async function checkUserRating(req, res) {
    const rating = req.body.ratingType;
    const product = req.body.product;

    try {
        const existingRating = await Rating.findOne({
            userId: req.body.userId,
            product: product,
            ratingType: rattingType
        });
        if (exisitingRating) {
            res.status(200).json({ status: true, message: "Already Rated" })
        } else {
            res.status(200).json({ status: False, message: "Not Rated" })
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message })
    }
}

module.exports = { addRating, checkUserRating, getRestaurant }
