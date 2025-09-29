// controllers/packController.js
const {Pack, Restaurant} = require("../models"); // Import the new Sequelize model

async function addPack(req, res) {
    const { restaurantId, packName, packDescription, isAvailable, price } = req.body;

    // A more specific check for required fields
    if (!restaurantId || !packName) {
        return res.status(400).json({ status: false, message: "Restaurant ID and Pack Name are required." });
    }

    try {
        // Optional: Verify that the restaurant actually exists before adding a pack to it.
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ status: false, message: "Restaurant not found." });
        }

        const newPack = await Pack.create({
            restaurantId,
            packName,
            packDescription,
            isAvailable,
            price
        });

        // Sequelize returns a clean JSON object by default, so no need to destructure _doc
        res.status(201).json({ status: true, message: "Pack has been created successfully", pack: newPack });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to create pack.", error: error.message });
    }
}

async function getPacks(req, res) {
    const { id } = req.params; // This is the restaurantId
    try {
        // .findAll() is the equivalent of .find()
        const packs = await Pack.findAll({
            where: { restaurantId: id }
        });
        
        // findAll returns an empty array if nothing is found, so a 404 isn't always necessary.
        // A client can just see the array is empty. This is a common REST practice.
        res.status(200).json(packs);
        
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to fetch packs.", error: error.message });
    }
}

async function getPacksById(req, res) {
  const { id } = req.params; // This is the primary key of the pack
  try {
      // .findByPk() is the equivalent of .findById()
      const pack = await Pack.findByPk(id);

      if (!pack) {
          return res.status(404).json({ status: false, message: 'Pack not found' });
      }
      res.status(200).json(pack);
      
  } catch (error) {
      res.status(500).json({ status: false, message: "Failed to fetch pack.", error: error.message });
  }
}

async function updatePack(req, res) {
    const { id } = req.params; // The primary key of the pack to update
    const updateData = req.body; // The fields to update
  
    try {
      // Find the pack by its ID and update it.
      // The update method returns an array with the number of affected rows.
      const [updatedRows] = await Pack.update(updateData, {
        where: { id: id }
      });
  
      if (updatedRows === 0) {
        return res.status(404).json({ status: false, message: 'Pack not found or no new data to update.' });
      }
  
      // Fetch the updated pack to return it in the response
      const updatedPack = await Pack.findByPk(id);
      res.status(200).json({ status: true, message: 'Pack updated successfully', pack: updatedPack });

    } catch (error) {
      res.status(500).json({ status: false, message: "Failed to update pack.", error: error.message });
    }
};

async function deletePack(req, res) {
    try {
      const { id } = req.params; // The primary key of the pack to delete

      // .destroy() is the equivalent of .findByIdAndDelete()
      const deletedCount = await Pack.destroy({
        where: { id: id }
      });
  
      if (deletedCount === 0) {
        return res.status(404).json({ status: false, message: "Pack not found." });
      }

      res.status(200).json({ status: true, message: "Pack successfully deleted" });

    } catch (error) {
      return res.status(500).json({ status: false, message: "Failed to delete pack.", error: error.message });
    }
}

module.exports = { addPack, getPacks, updatePack, deletePack, getPacksById };