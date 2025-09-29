// controllers/priceController.js
const {Price} = require("../models"); // Import the new Sequelize model

// This function creates the *first* price or replaces the existing one.
async function createPrice(req, res) {
    const { basePrice, serviceFee } = req.body; // Changed to req.body for standard practice

    try {
        if (!basePrice) {
            return res.status(400).json({ status: false, message: "The base price is required." });
        }

        // Check if a price row already exists
        const existingPrice = await Price.findOne();

        // If it exists, we'll destroy it to maintain a single row.
        if (existingPrice) {
            await Price.destroy({ where: { id: existingPrice.id } });
        }

        // Create the new price row.
        // 'time' defaults to NOW() in the model, so we don't need to set it here.
        const newPrice = await Price.create({
            basePrice: basePrice,
            serviceFee: serviceFee || 0, // Set a default if serviceFee is not provided
        });

        res.status(201).json(newPrice);

    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong.", error: error.message });
    }
}


const updatePrice = async (req, res) => {
    const { basePrice } = req.body; // Changed to req.body

    try {
        if (!basePrice) {
            return res.status(400).json({ status: false, message: "A base price is required." });
        }

        // Find the single price document.
        const priceDoc = await Price.findOne();

        if (!priceDoc) {
            return res.status(404).json({ status: false, message: "No price configuration found. Please create one first." });
        }

        // Prepare the entry for the historical log
        const oldPriceEntry = {
            price: priceDoc.basePrice,
            time: priceDoc.time || priceDoc.updatedAt
        };

        // Get the existing oldPrices array, or initialize a new one
        const oldPrices = priceDoc.oldPrices || [];
        oldPrices.push(oldPriceEntry);

        // Update the document with the new values
        await priceDoc.update({
            basePrice: basePrice,
            time: new Date(), // Set the time to now
            oldPrices: oldPrices // Save the updated historical array
        });

        res.status(200).json(priceDoc);

    } catch (error) {
        res.status(500).json({ status: false, message: "Base price update failed", error: error.message });
    }
};

async function updateServiceFee(req, res) {
    const { serviceFee } = req.body; // Changed to req.body

    try {
        if (serviceFee === undefined) {
             return res.status(400).json({ status: false, message: "Service fee is required." });
        }
        
        const price = await Price.findOne();

        if (!price) {
            return res.status(404).json({ status: false, message: "No price configuration found" });
        }

        // Use the .update() instance method for a clean update
        await price.update({
            serviceFee: serviceFee
        });

        res.status(200).json({
            status: true,
            message: "Service fee updated successfully",
            price: price
        });

    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong", error: error.message });
    }
}

async function getPrice(req, res) {
    try {
        // Fetch the one and only price document
        const latestPrice = await Price.findOne();

        if (!latestPrice) {
            return res.status(404).json({ status: false, message: "No price found" });
        }

        res.status(200).json(latestPrice);
    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong", error: error.message });
    }
}

module.exports = { createPrice, updatePrice, getPrice, updateServiceFee };