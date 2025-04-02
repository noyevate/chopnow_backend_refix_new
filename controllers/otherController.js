const Other = require("../models/Others");

async function CreateOthers (req, res) {
    const {service_fee, minLat, maxLat, minLng, maxLng} = req.body


    try {
        const existingOthers = await Other.findOne();

        if(existingOthers) {
            await Other.findByIdAndDelete(existingOthers._id);
        }

        const newOther = new Other({
            minLat,
            maxLat,
            minLng,
            maxLng
        })
        await newOther.save()
        res.status(201).json(newOther)
    } catch (error) {
        res.status(500).json({status: false, message: "something went wrong"})
    }

}


async function updateLocation (req, res) {
    const {minLat, maxLat, minLng, maxLng} = req.params

    try {
        const existingOthers = await Other.findOne()
        if(!existingOthers) {
            return res.status(404).json({status: false, message: "data not found"})
        }
        existingOthers.minLat = minLat
        existingOthers.maxLat = maxLat
        existingOthers.minLng = minLng
        existingOthers.maxLng = maxLng

        await existingOthers.save()
        res.status(200).json({
            status: true,
            message: "location updated successfully",
            others: existingOthers
        });

    } catch (error) {
        
    }
}
async function getLocation(req, res) {
    try {
        const location = await Other.findOne()
        if(!location) {
            return res.status(404).json({status: false, message: "dat not found"})
        }
        return res.status(200).json({status: true, message: "data found", location: location})

    } catch(error) {

    }
}

module.exports = {CreateOthers, updateLocation, getLocation}





