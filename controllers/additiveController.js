const Additive = require("../models/Additive");
const mongoose = require('mongoose');

async function addAdditive(req, res) {
  const { restaurantId, additiveTitle, additiveName, max, min, foods, isAvailable, price, } = req.body;
  

  try {
    const newAdditive = new Additive(req.body);
    await newAdditive.save();


    const { createdAt, updatedAt, ...others } = newAdditive._doc;
    res.status(201).json({ status: true, message: "additive has been created successfully", ...others });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
}


async function getAdditivesById(req, res) {
  const { id } = req.params;
  try {
    const additives = await Additive.find({ restaurantId: id }); // Using lean() to return a plain JavaScript object
    if (!additives) {
      return res.status(404).json({ status: false, message: 'Additives not found' });
    }
    res.status(200).json(additives);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
}

async function editAdditive(req, res) {
  const { additiveId } = req.params; // Get the additive ID from the URL
  const { additiveTitle, min, max } = req.body; // Get the updated fields from the request body

  try {
    // Find the additive by its ID and update the fields
    const updatedAdditive = await Additive.findByIdAndUpdate(
      additiveId,
      {
        additiveTitle: additiveTitle || undefined, // Update title if provided
        min: min !== undefined ? min : undefined, // Update min if provided
        max: max !== undefined ? max : undefined, // Update max if provided
      },
      { new: true, runValidators: true } // Return the updated document and validate inputs
    );

    if (!updatedAdditive) {
      return res.status(404).json({ message: 'Additive not found' });
    }

    // Return the updated additive
    res.status(201).json({ status: true, message: 'Additive updated successfully' });
  } catch (error) {
    res.status(500).json({ status: true, message: 'Internal server error' });
  }
};


async function deleteAdditive(req, res) {
  try {
    const { additiveId } = req.params;
    await Additive.findByIdAndDelete(additiveId)

    res.status(200).json({ status: true, message: "User successfully deleted" })
  } catch (error) {
    return res.status(500).json({ status: false, mssage: error.message })
  }
}

async function updateOptionInAdditive(req, res) {
  try {
      // Extract additiveId and optionId from the request parameters
      const { additiveId, optionId } = req.params;

      // Extract updatedData from the request body
      const { name, price, isAvailable } = req.body;  // Destructure the required fields directly

      // Find the additive by additiveId and update the specific option in the options array
      const updatedAdditive = await Additive.findOneAndUpdate(
          { _id: additiveId, 'options.id': optionId }, // Match additiveId and optionId
          {
              $set: {
                  'options.$.additiveName': name,   // Update name in the array
                  'options.$.price': price,  // Update price in the array
                  'options.$.isAvailable': isAvailable
              }
          },
          { new: true, runValidators: true } // Return the updated document and run validators
      );

      if (!updatedAdditive) {
          // Send a 404 response if no additive or option was found
          return res.status(404).json({ status: false, message: 'Option not found or additive does not exist' });
      }

      // Send a 200 response with the updated additive
      res.status(201).json({ status: true, message: 'Option updated successfully'});
  } catch (error) {
      // Catch any errors and send a 500 response
      res.status(500).json({ status: false, message: `Error updating option: ${error.message}` });
  }
}


async function updateAdditiveAvailability(req, res) {
  try {
    const { id: additiveId } = req.params; // Extract additiveId from URL params

    // Find the additive by its ID
    const additive = await Additive.findById(additiveId);

    if (!additive) {
      return res.status(404).json({ status: false, message: 'Additive not found' });
    }

    // Toggle isAvailable value
    additive.isAvailable = !additive.isAvailable;

    // Save the updated additive
    const updatedAdditive = await additive.save();

    res.status(200).json({
      status: true,
      message: 'Additive availability updated successfully',
      data: updatedAdditive
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Error updating availability: ${error.message}`
    });
  }
}



// async function deleteOptionFromAdditive(req, res)  {
//   try {
//     // Extract additiveId and optionId from request parameters
//     const { additiveId, optionId } = req.params;

//     // Find the additive by additiveId and remove the specific option from the array
//     const updatedAdditive = await Additive.findByIdAndUpdate(
//       additiveId,
//       {
//         $pull: { options: { _id: optionId } } // Pull the option with the matching optionId
//       },
//       { new: true } // Return the updated document
//     );

//     if (!updatedAdditive) {
//       return res.status(404).json({ status: false, message: 'Additive or option not found' });
//     }

//     // Return success response
//     res.status(200).json({ status: true, message: 'Option deleted successfully', data: updatedAdditive });
//   } catch (error) {
//     res.status(500).json({ status: false, message: `Error deleting option: ${error.message}` });
//   }
// };


async function deleteOptionFromAdditive(req, res) {
  try {
    // Extract additiveId and optionId from request parameters
    const { additiveId, optionId } = req.params;

    // Ensure optionId is cast to ObjectId
    const objectIdOptionId = mongoose.Types.ObjectId(optionId);

    // Find the additive by additiveId and remove the specific option from the array
    const updatedAdditive = await Additive.findByIdAndUpdate(
      additiveId,
      {
        $pull: { options: { _id: objectIdOptionId } } // Pull the option with the matching optionId
      },
      { new: true } // Return the updated document
    );

    if (!updatedAdditive) {
      return res.status(404).json({ status: false, message: 'Additive or option not found' });
    }

    // Return success response
    res.status(200).json({ status: true, message: 'Option deleted successfully', data: updatedAdditive });
  } catch (error) {
    res.status(500).json({ status: false, message: `Error deleting option: ${error.message}` });
  }
};





module.exports = { addAdditive, getAdditivesById, editAdditive, deleteAdditive, updateOptionInAdditive, updateAdditiveAvailability, deleteOptionFromAdditive}