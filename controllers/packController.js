const Pack = require("../models/Pack");
const mongoose = require('mongoose');

async function addPack(req, res) {
    const { restaurantId, packName, packDescription, isAvailable } = req.body;
    if (!restaurantId || !packName || !packDescription || isAvailable == undefined) {
        return res.status(400).json({ status: false, message: "You have a missing field" });
    }

    try {
        const newPack = new Pack(req.body);
        await newPack.save();
        res.status(201).json({ status: true, message: "additive has been created successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getPacks(req, res) {
    const { id } = req.params;
    try {
        const packs = await Pack.find({ restaurantId: id }); // Using lean() to return a plain JavaScript object
        if (!packs) {
            return res.status(404).json({ status: false, message: 'Packs not found' });
        }
        res.status(200).json(packs);
        
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function updatePack(req, res) {
    const { id } = req.params; // Get the additive ID from the URL
    const { packName, packDescription, price, isAvailable } = req.body; // Get the updated fields from the request body
  
    try {
      // Find the additive by its ID and update the fields
      const updatedPack = await Pack.findByIdAndUpdate(
        id,
        {
            packName: packName || undefined, // Update title if provided
            packDescription: packDescription || undefined, // Update min if provided
            price: price || undefined, // Update max if provided
            isAvailable: isAvailable
        },
        { new: true, runValidators: true } // Return the updated document and validate inputs
      );
  
      if (!updatedPack) {
        return res.status(404).json({ message: 'Pack not found' });
      }
  
      // Return the updated additive
      res.status(201).json({ status: true, message: 'Pack updated successfully' });
    } catch (error) {
      res.status(500).json({ status: true, message: `Internal server error: ${error.message}` });
    }
  };

// async function updatePack(req, res) {
//   const { id } = req.params; // Get the pack ID from the URL
//   const { packName, packDescription, price, isAvailable } = req.body; // Get the updated fields from the request body

//   try {
//       // Find the pack by its ID and update the fields
//       const updatedPack = await Pack.findByIdAndUpdate(
//           id,
//           {
//               packName: packName || undefined, 
//               packDescription: packDescription || undefined, 
//               price: price || undefined, 
//               isAvailable: isAvailable,
//           },
//           { new: true, runValidators: true } // Return the updated document and validate inputs
//       );

//       if (!updatedPack) {
//           return res.status(404).json({ message: 'Pack not found' });
//       }

//       // Find all foods containing this pack ID in their pack field
//       const foodsToUpdate = await Food.find({ 'pack._id': id });

//       // Update the matching packs within the food documents
//       for (const food of foodsToUpdate) {
//           food.pack = food.pack.map(pack => {
//               if (pack._id.toString() === id) {
//                   // Update the pack details in the food document
//                   return {
//                       ...pack,
//                       packName: packName || pack.packName,
//                       packDescription: packDescription || pack.packDescription,
//                       price: price || pack.price,
//                       isAvailable: isAvailable,
//                   };
//               }
//               return pack;
//           });

//           // Save the updated food document
//           await food.save();
//       }

//       // Return a success response
//       res.status(201).json({ 
//           status: true, 
//           message: 'Pack and associated foods updated successfully',
//       });
//   } catch (error) {
//       res.status(500).json({ 
//           status: false, 
//           message: `Internal server error: ${error.message}` 
//       });
//   }
// }


  async function deletePack(req, res) {
    try {
      const { id } = req.params;
      await Pack.findByIdAndDelete(id)
  
      res.status(200).json({ status: true, message: "Pack successfully deleted" })
    } catch (error) {
      return res.status(500).json({ status: false, mssage: error.message })
    }
  }



module.exports = { addPack, getPacks, updatePack, deletePack }