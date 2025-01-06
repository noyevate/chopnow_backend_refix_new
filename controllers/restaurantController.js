const Restaurant = require("../models/Restaurant");


async function addRestaurant(req, res) {
    const { title, imageUrl, phone, code, logoUrl, coords, restaurantMail, userId } = req.body;
    // if (!title || !imageUrl || !phone || !code || !logoUrl || !coords || restaurantMail || userId
    //     || !coords.latitude || !coords.longitude || !coords.address || !coords.title) {
    //     return res.status(400).json({ status: false, message: "You have a missing field" });
    // };
    try {

        const existingRestaurant = await Restaurant.findOne({ $or: [{ userId }, { title }] });

        if (existingRestaurant) {
            if (existingRestaurant.userId.toString() === userId) {
                return res.status(400).json({ status: false, message: "User already has a restaurant" });
            } else if (existingRestaurant.title === title) {
                return res.status(400).json({ status: false, message: "A restaurant with this title already exists" });
            }
        }
        const newRestaurant = new Restaurant(req.body);
        await newRestaurant.save();
        res.status(201).json({
            status: true, message: "Restaurant added Successfully", newRestaurant: {
                restaurantId: newRestaurant._id,
                title: newRestaurant.title,
                rating: newRestaurant.rating,
                address: newRestaurant.coords.address,
                verification: newRestaurant.verification,
                code: newRestaurant.code
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getRestaurantById(req, res) {
    const id = req.params.id;
    try {
        const restaurants = await Restaurant.findById(id)
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getRestaurantByUser(req, res) {
    const userId = req.params.userId;

    try {
        const restaurant = await Restaurant.findOne({ userId: userId });
        if (!restaurant) {
            return res.status(404).json({ status: false, message: "Restaurant not found" });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getRestaurantbyUserId(req, res) {
    const userId = req.user.id;
    try {
        const restaurant = await Restaurant.find({ userId: userId })

        if (!restaurant) {
            return res.status(404).json({ status: false, message: "Restaurant not found" });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

async function getRandomRestaurant(req, res) {
    const code = req.params.code;
    try {
        let randomRestaurant = [];

        if (code) {
            randomRestaurant = await Restaurant.aggregate([
                { $match: { code } },
                { $sample: { size: 20 } }
            ]);
        };
        if (randomRestaurant.length === 0) {
            randomRestaurant = await Restaurant.aggregate([
                { $match: { isAvailable: true } },
                { $sample: { size: 5 } }
            ]);
        };
        res.status(200).json(randomRestaurant);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getAllNearbyRestaurant(req, res) {
    const code = req.params.code;
    try {
        let allNearbyRestaurants = [];

        if (code) {
            allNearbyRestaurants = await Restaurant.aggregate([
                { $match: { code } },

            ]);
        };
        if (allNearbyRestaurants.length === 0) {
            allNearbyRestaurants = await Restaurant.aggregate([
                { $match: { isAvailable: true } },

            ]);
        }


        res.status(200).json(allNearbyRestaurants);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function restaurantAvailability(req, res) {
    try {
        const restaurantId = req.params.id;
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).send({ message: 'Restaurant not found' });
        }

        restaurant.isAvailabe = !restaurant.isAvailabe;

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { isAvailabe: restaurant.isAvailabe },
            { new: true, runValidators: true }
        );

        res.status(200).send(updatedRestaurant);
    } catch (error) {
        res.status(500).send({ message: 'Internal server error', error })
    }
}

async function getPopularRestaurant(req, res) {
    try {
        let popularRestaurants = [];
        popularRestaurants = await Restaurant.aggregate([
            { $match: { isAvailabe: true } },
            { $sort: { rating: -1 } },
            { $limit: 30 }
        ]);

        console.log('Matched Restaurants:', popularRestaurants);
        res.status(200).json(popularRestaurants);
    } catch (err) {
        console.error('Error fetching popular restaurants:', err);
        res.status(500).json({ error: 'Failed to fetch popular restaurants' });
    }
};


async function addTimeToRestaurant(req, res) {
    try {
        const { restaurantId } = req.params; // Get restaurantId from URL params
        const { orderType, day, open, close, orderCutOffTime, menuReadyTime } = req.body;

        // Validate the input
        if (!orderType || !day || !open || !close) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: orderType, day, open, close.',
            });
        }

        // Find the restaurant by ID
        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found.',
            });
        }

        // Clear the existing time entries
        restaurant.time = [];

        // Create the new time entry object
        const newTimeEntry = {
            orderType,
            day,
            open,
            close,
            orderCutOffTime: orderCutOffTime || null,
            menuReadyTime: menuReadyTime || null,
        };

        // Add the new time entry to the restaurant's time array
        restaurant.time.push(newTimeEntry);

        // Save the restaurant with the updated time array
        await restaurant.save();

        // Respond with a success message
        return res.status(200).json({
            success: true,
            message: 'All existing time entries deleted and new time added successfully.',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
}

async function updatedRestaurant(req, res) {
    const { restaurantId } = req.params
    try {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ status: false, message: "Restaurant not found" });
        }

        // Update restaurant with new data
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $set: updateData },  // Set the new values
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        res.status(200).json({
            status: true,
            message: "Restaurant updated successfully",
            updatedRestaurant
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }

}






module.exports = { addRestaurant, getRestaurantById, addTimeToRestaurant, getRestaurantByUser, getRestaurantbyUserId, getRandomRestaurant, getAllNearbyRestaurant, restaurantAvailability, getPopularRestaurant, updatedRestaurant }

