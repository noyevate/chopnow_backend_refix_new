const Cart = require("../models/Cart");

async function addProductToCart(req, res) {
    const userId = req.user.id;
    const { productId, additives, totalPrice, Tquantity } = req.body;

    // Convert totalPrice and Tquantity to numbers
    const parsedTotalPrice = Number(totalPrice);
    const parsedTquantity = Number(Tquantity);

    if (isNaN(parsedTotalPrice)) {
        return res.status(400).json({ status: false, message: "Invalid data type for totalPrice or Tquantity" });
    }

    let count;
    try {
        const existingProduct = await Cart.findOne({ userId: userId, productId: productId });
        count = await Cart.countDocuments({ userId });

        if (existingProduct) {
            // Update totalPrice and Tquantity
            existingProduct.totalPrice += parsedTotalPrice * parsedTquantity;
            existingProduct.Tquantity += parsedTquantity;

            await existingProduct.save();
            return res.status(200).json({ status: true, count: count });
        } else {
            // Create new cart item
            const newCartItem = new Cart({
                userId: userId,
                productId: productId,
                additives: additives,
                totalPrice: parsedTotalPrice,
                Tquantity: parsedTquantity
            });
            await newCartItem.save();

            count = await Cart.countDocuments({ userId: userId });
            return res.status(201).json({ status: true, count: count });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}


async function removeCartIem(req, res) {
    const cartItemId = req.params.id;
    const userId = req.user.id;

    try {
        await Cart.findByIdAndDelete({ _id: cartItemId });
        const count = await Cart.countDocuments({ userId });
        return res.status(200).json({ status: true, count: count });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

async function getCart(req, res) {
    const userId = req.user.id;
    try {
        const cart = await Cart.find({ userId: userId }).populate({
            path: "productId",
            select: "imageUrl title restaurant rating ratingCount",
            populate: {
                path: "restaurant",
                select: "time coords"
            }
        });
        return res.status(200).json(cart)
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

async function getCartCount(req, res) {
    const userId = req.user.id;

    try {
        const count = await Cart.find({ userId: userId });
        return res.status(200).json({ status: true, count: count });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

async function decrementProductQty(req, res) {
    const userId = req.user.id;
    const id = req.params.id;

    try {
        const cartItem = await Cart.findById(id);

        if (cartItem) {
            const productPrice = cartItem.totalPrice / cartItem.quantity;
            if (cartItem.quantity > 1) {
                cartItem.quantity -= 1;
                cartItem.totalPrice -= productPrice;
                await cartItem.save();
                return res.status(200).json({ status: true, message: "Product quantity successfully decremented" });
            } else {
                await Cart.findOneAndDelete({ _id: id });
                return res.status(200).json({ status: true, message: "Product removed successfully from the cart" });
            }
        } else {
            return res.status(400).json({ status: true, message: "Cart item not found" });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

module.exports = { addProductToCart, removeCartIem, getCart, getCartCount, decrementProductQty}