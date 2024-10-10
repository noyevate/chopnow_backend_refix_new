const Additive = require("../models/Additive");
const mongoose = require('mongoose');

async function addAdditive(req, res) {
    const { restaurantId, additiveTitle, additiveName, max, min, foods, isAvailable, price, } = req.body;
    // if (restaurantId || additiveTitle || max || min || additiveName || foods || isAvailable || price) {
    //     return res.status(400).json({ status: false, message: "You have a missing field" });
    // } 

    try {
        // Add food
        const newAdditive = new Additive(req.body);
        await newAdditive.save();
        console.log(newAdditive.restaurantId)
        console.log(newAdditive.additiveTitle)
        console.log(newAdditive.additiveName)
        console.log(newAdditive.max)
        console.log(newAdditive.min)
        console.log(newAdditive.price)
        console.log(newAdditive.foods)
        console.log(newAdditive.isAvailable)
        

        res.status(201).json({ status: true, message: "additive has been created successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


module.exports = { addAdditive}