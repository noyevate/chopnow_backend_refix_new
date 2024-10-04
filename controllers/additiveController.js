const Additive = require("../models/Additive");
const Restaurant = require("../models/Restaurant");
const mongoose = require('mongoose');

async function addAdditive(req, res) {
    const { restaurantId, name, price } = req.body;
    if (restaurantId || name || price) {
        return res.status(400).json({ status: false, message: "You have a missing field" });
    } 

    try {
        // Add food
        const newFood = new Additive(req.body);
        await newAdditive.save();
        

        res.status(201).json({ status: true, message: "additive has been added successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


module.exports = { addAdditive}