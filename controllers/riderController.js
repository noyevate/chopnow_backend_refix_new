const Restaurant = require("../models/Restaurant");
const Order= require("../models/Order");
const Rider = require("../models/Rider");

async function createRider(req, res) {
    const { userId, vehicleImgUrl, vehicleType, vehicleBrand, plateNumber, guarantors, bankName, bankAccount, bankAccountName, coords} = req.body;
    
    try {

        const existingRider = await Rider.findOne({ $or: [{ userId }] });

        if (existingRider) {
            if (existingRider.userId.toString() === userId) {
                return res.status(400).json({ status: false, message: "User already has a created a rider" });
            } else if (existingRider.title === title) {
                return res.status(400).json({ status: false, message: "A rider with this title already exists" });
            }
        }
        const newCreateRider = new Rider(req.body);
        await newCreateRider.save();
        res.status(201).json({
            status: true, message: "Rider added Successfully", newCreateRider: {
                riderId: newCreateRider._id,
                vehicle: newCreateRider.vehicleType,
                rating: newCreateRider.rating,
                postalcode: newCreateRider.coords.postalCode,
                verification: newCreateRider.verification,
            }, 
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


async function searchRestaurant (req, res)  {
    try {
        const { title } = req.query;
        
        if (!title) {
            return res.status(400).json({ status: false, message: "Title is required for search." });
        }

        // Perform a case-insensitive search using a regex pattern
        const restaurants = await Restaurant.find({ title: { $regex: title, $options: 'i' } });

        if (restaurants.length === 0) {
            return res.status(404).json({ status: false, message: "No restaurants found." });
        }

        res.status(200).json({ status: true, data: restaurants });
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};


async function assignRiderToOrder (req, res) {
    try {
        const { orderId, riderId } = req.params;
        
        if (!orderId || !riderId) {
            return res.status(400).json({ status: false, message: "Order ID and Rider ID are required." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found." });
        }

        order.driverId = riderId;
        await order.save();

        res.status(200).json({ status: true, message: "Rider assigned successfully.", data: order });
    } catch (error) {
        res.status(500).json({ status: false, message: "Server error", error: error.message });
    }
};




module.exports = {createRider, searchRestaurant, assignRiderToOrder}