const Price = require("../models/Price");


async function createPrice (req, res) {
    const {basePrice, serviceFee} = req.params;

    try {
    if(!basePrice) {
        res.status(400).json({message: "the base price are required."})
    }
    const existingPrice = await Price.findOne();
    if (existingPrice) {
        await Price.findByIdAndDelete(existingPrice._id);
    }
    const newPrice = new Price({
        basePrice: basePrice,
        serviceFee: serviceFee,
        time: Date.now()
    });
    await newPrice.save();
    res.status(201).json( newPrice)
    } catch (error) {
        res.status(500).json({message: "something went wrong", newPrice})
    } 
}


const updatePrice = async (req, res) => {
    const { id, basePrice } = req.params;

    try {
        if (!id || !basePrice) {
            return res.status(400).json({ message: "Both ID and base price are required." });
        }

        const priceDoc = await Price.findById(id);

        if (!priceDoc) {
            return res.status(404).json({ message: "No base price found" });
        }

        // Save the old price before updating
        const oldPriceEntry = {
            price: priceDoc.basePrice,
            time: priceDoc.time || priceDoc.updatedAt 
        };

        priceDoc.basePrice = basePrice;
        priceDoc.time = Date.now();
        if (!priceDoc.oldPrices) {
            priceDoc.oldPrices = [];
        }
        priceDoc.oldPrices.push(oldPriceEntry);

        await priceDoc.save();

        res.status(200).json(
            priceDoc
        );

    } catch (error) {
        res.status(500).json({ message: "Base price update failed", error: error.message });
    }
};

async function updateServiceFee (req, res) {
    const {serviceFee} = req.params
    
    try {
        const price = await Price.findOne()
        if(!price) {
            return res.status(404).json({status: false, message: "dat not found"})
        }
        price.serviceFee = serviceFee
        await price.save()
        res.status(200).json({
            status: true,
            message: "service fee updated successfully",
            price: price
        });

    } catch (error) {
        res.status(500).json({status: false, message: "something went wrong"})      
    }
}



async function getPrice(req, res) {
    try {
        const latestPrice = await Price.findOne(); // Fetch the only existing price document

        if (!latestPrice) {
            return res.status(404).json({ message: "No price found" });
        }

        res.status(200).json( latestPrice );
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
}





module.exports = {createPrice, updatePrice, getPrice, updateServiceFee}