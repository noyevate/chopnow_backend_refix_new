const {User, Address} = require("../models");
const logger = require('../utils/logger');

async function addAddress(req, res) {
    try {
        logger.info(`trying created a new address`, { controller: 'addressController', userid: `${req.user.id} : addAddress`});
        const isDefault = req.body.default === true;

        // Check if an identical address already exists for this user.
        const existingAddress = await Address.findOne({
            where: {
                userId: req.user.id,
                addressLine1: req.body.addressLine1,
                postalCode: req.body.postalCode,
                latitude: req.body.latitude,
                longitude: req.body.longitude
            }
        });

        if (existingAddress) {
            return res.status(409).json({ // 409 Conflict
                status: false,
                message: "Address already exists"
            });
        }

        // If the new address is default, set all other addresses for this user to non-default.
        if (isDefault) {
            await Address.update({ isDefault: false }, {
                where: {
                    userId: req.user.id,
                    isDefault: true
                }
            });
        }

        // Create the new address using the renamed 'isDefault' field.
        const newAddress = await Address.create({
            userId: req.user.id,
            addressLine1: req.body.addressLine1,
            postalCode: req.body.postalCode,
            isDefault: isDefault,
            deliveryInstructions: req.body.deliveryInstructions,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        });

        logger.info(`Successfully created a new address`, { controller: 'addressController', userid: `${req.user.id} : addAddress`});

        return res.status(201).json({
            status: true,
            message: "Address successfully created",
            address: newAddress
        });

    } catch (error) {
        logger.error(`creating a new address failed: ${error.message}`, { controller: 'addressController', userid: `${req.user.id} : addAddress`});
        return res.status(500).json({
            status: false,
            message: "Failed to add address.",
            error: error.message
        });
    }
}

async function getAddress(req, res) {
    try {
        logger.info(`Getting All..`, { controller: 'addressController', userid: `${req.user.id} : getAddress`});
        const addresses = await Address.findAll({
            where: { userId: req.user.id }
        });
        logger.info(`Successfully getting address`, { controller: 'addressController', userid: `${req.user.id} : getAddress`});
        return res.status(200).json(addresses);
    } catch (error) {
        logger.error(`error getting all address: ${error.message}`, { controller: 'addressController', userid: `${req.user.id} : addAddress`});
        return res.status(500).json({ status: false, message: "Failed to get addresses.", error: error.message });
    }
}

async function deleteAddress(req, res) {
    try {
        logger.info(`Deleting address..`, { controller: 'addressController', userid: `${req.user.id} : deleteAddress`});
        const deletedCount = await Address.destroy({
            where: { id: req.params.id }
        });

        if (deletedCount === 0) {
            logger.warn(`No address found..`, { controller: 'addressController', userid: `${req.user.id} : deleteAddress`});
             return res.status(404).json({ status: false, message: "Address not found." });
        }
        
        logger.info(`Deleting address successful`, { controller: 'addressController', userid: `${req.user.id} : deleteAddress`});
        return res.status(200).json({ status: true, message: "Address successfully deleted" }); // Changed to 200 OK

    } catch (error) {
        logger.error(`error deleting address: ${error.message}`, { controller: 'addressController', userid: `${req.user.id} : deleteAddress`});
        return res.status(500).json({ status: false, message: "Failed to delete address.", error: error.message });
    }
}

async function setAddressDefault(req, res) {
    const addressId = req.params.id;
    const userId = req.user.id;

    try {
        logger.info(`setting address as default..`, { controller: 'addressController', userid: `${req.user.id} : setAddressDefault`});
      
        await Address.update({ isDefault: false }, {
            where: { userId: userId }
        });

        const [updatedRows] = await Address.update({ isDefault: true }, {
            where: { id: addressId, userId: userId } // also check userId for security
        });

        if (updatedRows > 0) {
            logger.info(`successfully setting address as default..`, { controller: 'addressController', userid: `${req.user.id} : setAddressDefault`});
            return res.status(200).json({ status: true, message: "Address successfully set as default" });
        } else {
            logger.warn(`Address not found for this user.`, { controller: 'addressController', userid: `${req.user.id} : setAddressDefault`});
            return res.status(404).json({ status: false, message: "Address not found for this user." });
        }
    } catch (error) {
        logger.info(`error stting address as default: ${error.message}..`, { controller: 'addressController', userid: `${req.user.id} : setAddressDefault`});
        return res.status(500).json({ status: false, message: "Failed to set default address.", error: error.message });
    }
}

async function getDefaultAddress(req, res) {
    const userId = req.user.id;

    try {
        logger.info(`getting defult address`, { controller: 'addressController', userid: `${req.user.id} : getDefaultAddress`});
        const address = await Address.findOne({
            where: {
                userId: userId,
                isDefault: true
            }
        });
        
        if (!address) {
            logger.warn(`No default address found.`, { controller: 'addressController', userid: `${req.user.id} : getDefaultAddress`});
            return res.status(404).json({ status: false, message: "No default address found." });
        }

        logger.info(`default address found.`, { controller: 'addressController', userid: `${req.user.id} : getDefaultAddress`});
        res.status(200).json(address);

    } catch (error) {
        logger.error(`Failed to get default address ${error.message}`, { controller: 'addressController', userid: `${req.user.id} : getDefaultAddress`});
        return res.status(500).json({ status: false, message: "Failed to get default address.", error: error.message });
    }
}

async function getAddressById(req, res) {
    const addressId = req.params.id;

    try {
        logger.info(`getting defult address`, { controller: 'addressController', userid: `${req.user.id} : getDefaultAddress  addressID: ${addressId}`});
        const address = await Address.findByPk(addressId);
        if (!address) {
            return res.status(404).json({ status: false, message: "Address not found" });
        }
        logger.info(`address found.`, { controller: 'addressController', userid: `${req.user.id} : getDefaultAddress  addressID: ${addressId}`});
        return res.status(200).json({ status: true, address: address });
    } catch (error) {
        logger.info(`Failed to get address by ID.`, { controller: 'addressController', userid: `${req.user.id} : getDefaultAddress  addressID: ${addressId}`});
        return res.status(500).json({ status: false, message: "Failed to get address by ID.", error: error.message });
    }
}

module.exports = { addAddress, getAddress, deleteAddress, setAddressDefault, getDefaultAddress, getAddressById };