// controllers/cartController.js
const {Cart, Food, Restaurant} = require("../models");

async function addProductToCart(req, res) {
    const { foodId, additives, userId, quantity } = req.body;
    const itemQuantity = quantity || 1;

    try {
        // --- Step 1: Get authoritative price from the Food table ---
        const foodItem = await Food.findByPk(foodId);
        if (!foodItem) {
            return res.status(404).json({ status: false, message: "Food item not found." });
        }
        
        const singleItemPrice = parseFloat(foodItem.price);
        
        // --- Step 2: Find the existing cart item ---
        const existingProduct = await Cart.findOne({
            where: { userId: userId, foodId: foodId }
        });

        if (existingProduct) {
            // --- Step 3a: If item exists, UPDATE it ---
            const newQuantity = existingProduct.quantity + itemQuantity;
            
            // Intelligently merge the new additives with the old ones
            const mergedAdditives = [...existingProduct.additives];
            additives.forEach(newAdd => {
                const existingAdd = mergedAdditives.find(oldAdd => oldAdd.name === newAdd.name);
                if (existingAdd) {
                    // If additive already exists, just update its quantity
                    existingAdd.quantity += (newAdd.quantity || 1);
                } else {
                    // If it's a new additive, push it to the array
                    mergedAdditives.push(newAdd);
                }
            });

            // --- THIS IS THE FIX ---
            // Recalculate the total price based on the SOURCE OF TRUTH
            // 1. Calculate the base price for all items
            const baseItemsPrice = singleItemPrice * newQuantity;
            // 2. Calculate the total price of all merged additives
            const totalAdditivesPrice = mergedAdditives.reduce((sum, add) => sum + (add.price * add.quantity), 0);
            // 3. The new total price is the sum of both
            const newTotalPrice = baseItemsPrice + totalAdditivesPrice;
            // --- END FIX ---

            await existingProduct.update({
                quantity: newQuantity,
                totalPrice: newTotalPrice,
                additives: mergedAdditives
            });

        } else {
            // --- Step 3b: If item does not exist, CREATE it ---
            // Calculate the total price for the new items being added
            const additivesPrice = additives.reduce((sum, add) => sum + (add.price * add.quantity), 0);
            const incomingTotalPrice = (singleItemPrice * itemQuantity) + additivesPrice;

            await Cart.create({
                userId: userId,
                foodId: foodId,
                additives: additives,
                totalPrice: incomingTotalPrice,
                quantity: itemQuantity
            });
        }
        
        // --- Step 4: Get the updated total count for the user's cart ---
        const count = await Cart.count({ where: { userId: userId } });
        return res.status(200).json({ status: true, count: count });

    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to add product to cart.", error: error.message });
    }
}

async function removeCartIem(req, res) {
    const cartItemId = req.params.id;
    const userId = req.user.id;

    try {
        await Cart.destroy({
            where: {
                id: cartItemId,
                userId: userId // Ensure users can only delete their own items
            }
        });

        const count = await Cart.count({ where: { userId: userId } });
        return res.status(200).json({ status: true, count: count });

    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to remove cart item.", error: error.message });
    }
}

async function getCart(req, res) {
    const userId = req.user.id;
    try {
        const cart = await Cart.findAll({
            where: { userId: userId },
            // This is the Sequelize equivalent of .populate()
            include: [{
                model: Food,
                as: 'food', // You need to define this alias in your Cart model association
                attributes: ['imageUrl', 'title', "id"],
                include: [{
                    model: Restaurant,
                    as: 'restaurant', // And this alias in your Food model association
                    attributes: [ "id", "logoUrl", "title"] // Assuming 'coords' were flattened
                }]
            }]
        });
        return res.status(200).json(cart);

    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to get cart.", error: error.message });
    }
}

async function getCartCount(req, res) {
    const userId = req.user.id;
    try {
        // .count is the direct equivalent of .countDocuments
        const count = await Cart.count({
            where: { userId: userId }
        });
        // The original code returned the full documents, not just the count.
        // I've corrected it to return just the number.
        return res.status(200).json({ status: true, count: count });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to get cart count.", error: error.message });
    }
}

async function decrementProductQty(req, res) {
    const cartItemId = req.params.id;
    const userId = req.user.id;

    try {
        const cartItem = await Cart.findOne({
            where: {
                id: cartItemId,
                userId: userId
            }
        });

        if (cartItem) {
            // Assuming the totalPrice is for the total quantity in the cart
            const productPrice = cartItem.totalPrice / cartItem.quantity;

            if (cartItem.quantity > 1) {
                const newQuantity = cartItem.quantity - 1;
                const newTotalPrice = cartItem.totalPrice - productPrice;
                await cartItem.update({
                    quantity: newQuantity,
                    totalPrice: newTotalPrice
                });
                return res.status(200).json({ status: true, message: "Product quantity successfully decremented" });
            } else {
                // If quantity is 1, delete the item
                await cartItem.destroy();
                return res.status(200).json({ status: true, message: "Product removed successfully from the cart" });
            }
        } else {
            return res.status(404).json({ status: false, message: "Cart item not found" });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to decrement quantity.", error: error.message });
    }
}

module.exports = { addProductToCart, removeCartIem, getCart, getCartCount, decrementProductQty };