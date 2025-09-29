// / controllers/additiveController.js
const {Additive, Restaurant} = require("../models");
const { v4: uuidv4 } = require('uuid'); // To generate unique IDs for options
const logger = require("../utils/logger")



async function addAdditive(req, res) {
  try {
    const { restaurantId } = req.body;
    // Optional but recommended: check if restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
        return res.status(404).json({ status: false, message: "Restaurant not found." });
    }

    // Ensure options array has unique IDs if it exists
    if (req.body.options && Array.isArray(req.body.options)) {
      req.body.options = req.body.options.map(option => ({
        ...option,
        id: option.id || uuidv4() // Assign a unique ID if one doesn't exist
      }));
    }

    const newAdditive = await Additive.create(req.body); 

    res.status(201).json({ status: true, message: "Additive has been created successfully", additive: newAdditive });
  } catch (error) {
    res.status(500).json({ status: false, message: "Failed to create additive.", error: error.message });
  }
}

async function getAdditivesById(req, res) {
  const { id } = req.params; // This is the restaurantId
  try {
    const additives = await Additive.findAll({
      where: { restaurantId: id }
    });
    res.status(200).json(additives);
  } catch (error) {
    res.status(500).json({ status: false, message: "Failed to fetch additives.", error: error.message });
  }
}

async function editAdditive(req, res) {
  const { additiveId } = req.params;
  const { additiveTitle, min, max } = req.body;

  try {
    const [updatedRows] = await Additive.update({
      additiveTitle,
      min,
      max
    }, {
      where: { id: additiveId }
    });

    if (updatedRows === 0) {
      return res.status(404).json({ status: false, message: 'Additive not found' });
    }

    res.status(200).json({ status: true, message: 'Additive updated successfully' });
  } catch (error) {
    res.status(500).json({ status: false, message: "Failed to update additive.", error: error.message });
  }
};

async function deleteAdditive(req, res) {
  try {
    const { additiveId } = req.params;
    const deletedCount = await Additive.destroy({
      where: { id: additiveId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ status: false, message: "Additive not found." });
    }

    res.status(200).json({ status: true, message: "Additive successfully deleted" });
  } catch (error) {
    return res.status(500).json({ status: false, message: "Failed to delete additive.", error: error.message });
  }
}

async function updateOptionInAdditive(req, res) {
  try {
    const { additiveId, optionId } = req.params;
    const { name, price, isAvailable } = req.body;

    const additive = await Additive.findByPk(additiveId);

    if (!additive) {
      return res.status(404).json({ status: false, message: 'Additive not found.' });
    }
    
    // Get the current options, or an empty array if null
    let options = additive.options || [];
    let optionFound = false;

    // Find and update the option in the array
    options = options.map(option => {
      if (option.id === optionId) {
        optionFound = true;
        return { ...option, additiveName: name, price: price, isAvailable: isAvailable };
      }
      return option;
    });

    if (!optionFound) {
      return res.status(404).json({ status: false, message: 'Option not found within the additive.' });
    }
    
    // Save the entire updated options array back to the additive
    await additive.update({ options: options });

    res.status(200).json({ status: true, message: 'Option updated successfully' });
  } catch (error) {
    res.status(500).json({ status: false, message: `Error updating option: ${error.message}` });
  }
}

async function updateAdditiveAvailability(req, res) {
  try {
    const { id } = req.params; // This is additiveId

    const additive = await Additive.findByPk(id);

    if (!additive) {
      return res.status(404).json({ status: false, message: 'Additive not found' });
    }

    // Toggle the value and save
    await additive.update({ isAvailable: !additive.isAvailable });

    res.status(200).json({
      status: true,
      message: 'Additive availability updated successfully',
      data: additive
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Error updating availability: ${error.message}`
    });
  }
}

async function deleteOptionFromAdditive(req, res) {
  try {
    const { additiveId, optionId } = req.params;

    const additive = await Additive.findByPk(additiveId);

    if (!additive) {
      return res.status(404).json({ status: false, message: 'Additive not found.' });
    }
    
    let options = additive.options || [];
    const initialLength = options.length;
    
    // Filter out the option to be deleted
    options = options.filter(option => option.id !== optionId);

    if (options.length === initialLength) {
        return res.status(404).json({ status: false, message: 'Option not found within the additive.' });
    }
    
    // Save the filtered array back to the database
    await additive.update({ options: options });

    res.status(200).json({ status: true, message: 'Option deleted successfully', data: additive });
  } catch (error) {
    res.status(500).json({ status: false, message: `Error deleting option: ${error.message}` });
  }
};

module.exports = { addAdditive, getAdditivesById, editAdditive, deleteAdditive, updateOptionInAdditive, updateAdditiveAvailability, deleteOptionFromAdditive };