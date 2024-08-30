const User = require("../models/User");
const Address = require("../models/Address");


async function addAddress(req, res) {
    try {
        const isDefault = req.body.default === true;  // Ensure this is boolean
        console.log("Received default value:", isDefault);

        if (isDefault) {
            await Address.updateMany({ userId: req.user.id, default: true }, { $set: { default: false } });
        }

        const newAddress = new Address({
            userId: req.user.id,
            addressLine1: req.body.addressLine1,
            postalCode: req.body.postalCode,
            default: isDefault,
            deliveryInstructions: req.body.deliveryInstructions,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        });

        await newAddress.save();
        console.log("Saved Address:", newAddress); // Debugging line
        return res.status(201).json({ status: true, message: "Address successfully created" });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}







async function getAddress(req, res) {
    try {
        const addresses = await Address.find({ userId: req.user.id });
        return res.status(200).json(addresses);
    } catch (error) {
        return res.status(500).json({ status: false, mssage: error.message });
    }
}

async function deleteAddress(req, res) {
    try {
        await Address.findByIdAndDelete(req.params.id);
        return res.status(201).json({ status: true, message: "Address successfully deleted" })
    } catch (error) {
        return res.status(500).json({ status: false, mssage: error.message });
    }
}

async function setAddressDefault(req, res) {
    const addressId = req.params.id;
    const userId = req.user.id;

    try {
        await Address.updateMany({ userId: req.user.id }, { default: false });
        const updatedAddress = await Address.findByIdAndUpdate(addressId, { default: true });
        if (updatedAddress) {
            await Address.findByIdAndUpdate(userId, { address: addressId });
            return res.status(200).json({ status: true, message: "Address successfully set at default" })
        } else {
            return res.status(400).json({ status: false, mssage: "Address not found" });
        }
    } catch (error) {
        return res.status(500).json({ status: false, mssage: error.message });
    }
}

async function getDefaultAddress(req, res) {
    const userId = req.user.id

    try {
        const address = await Address.findOne({ userId: userId, default: true })
        //console.log(address.addressLine1)
        res.status(200).json(address)
    } catch (error) {
        return res.status(500).json({ status: false, mssage: error.message });
    }
}
async function getAddressById(req, res) {
    const addressId = req.params.id;

    try {
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ status: false, message: "Address not found" });
        }
        return res.status(200).json({ status: true, address: address });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }

}

module.exports = { addAddress, getAddress, deleteAddress, setAddressDefault, getDefaultAddress, getAddressById }
