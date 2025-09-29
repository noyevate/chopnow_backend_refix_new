// controllers/otherController.js
const {Other} = require("../models"); // Import the new Sequelize model

// This function creates the *first* configuration or replaces the existing one.
async function CreateOthers(req, res) {
    // Get all data from the request body
    const { minLat, maxLat, minLng, maxLng } = req.body;

    try {
        // Check if a configuration row already exists
        const existingOthers = await Other.findOne();

        // If one exists, destroy it to maintain a single row.
        if (existingOthers) {
            await Other.destroy({ where: { id: existingOthers.id } });
        }

        // Create the new configuration row.
        const newOther = await Other.create({
            minLat,
            maxLat,
            minLng,
            maxLng
        });

        res.status(201).json({ status: true, message: "Configuration created successfully.", data: newOther });

    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong.", error: error.message });
    }
}

async function updateLocation(req, res) {
    const { minLat, maxLat, minLng, maxLng } = req.body;

    try {
        // Find the single configuration document.
        const existingOthers = await Other.findOne();

        if (!existingOthers) {
            return res.status(404).json({ status: false, message: "No configuration found. Please create one first." });
        }

        // Use the instance .update() method for a clean update.
        // It saves the changes to the database immediately.
        const updatedOthers = await existingOthers.update({
            minLat,
            maxLat,
            minLng,
            maxLng
        });

        res.status(200).json({
            status: true,
            message: "Location configuration updated successfully.",
            others: updatedOthers
        });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update location configuration.", error: error.message });
    }
}

async function getLocation(req, res) {
    try {
        // Fetch the one and only configuration document
        const locationConfig = await Other.findOne();

        if (!locationConfig) {
            return res.status(404).json({ status: false, message: "No location configuration found" });
        }

        return res.status(200).json({ status: true, message: "Data found", location: locationConfig });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to fetch location configuration.", error: error.message });
    }
}

module.exports = { CreateOthers, updateLocation, getLocation };