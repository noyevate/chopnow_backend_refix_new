const Food = require("../models/Food");
const Restaurant = require("../models/Restaurant");
const mongoose = require('mongoose');


async function addFood(req, res) {
    const { title, foodTags, category, restaurant_category, code, restaurant, description, time, price, additive, imageUrl } = req.body;
    if (!title || !foodTags || !category || !code || !restaurant || !description || !time || !price || !additive || !imageUrl || !restaurant_category) {
        return res.status(400).json({ status: false, message: "You have a missing field" });
    }

    try {
        // Add food
        const newFood = new Food(req.body);
        await newFood.save();

        // Update restaurant categories
        const restaurantDoc = await Restaurant.findById(restaurant);
        if (restaurantDoc) {
            const categoryIndex = restaurantDoc.restaurant_categories.findIndex(cat => cat.name === restaurant_category);
            if (categoryIndex === -1) {
                // Category not found, add new
                restaurantDoc.restaurant_categories.push({
                    name: restaurant_category,
                    additives: additive // Adding additives to category
                });
            } else {
                // Category found, update additives
                restaurantDoc.restaurant_categories[categoryIndex].additives = Array.from(new Set([
                    ...restaurantDoc.restaurant_categories[categoryIndex].additives,
                    ...additive
                ]));
            }
            restaurantDoc.foods.push(newFood._id);
            await restaurantDoc.save();
        }

        res.status(201).json({ status: true, message: "Food has been added successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}
async function getFoodById(req, res) {
    const id = req.params.id;
    try {
        const food = await Food.findById(id).lean(); // Using lean() to return a plain JavaScript object
        if (!food) {
            return res.status(404).json({ status: false, message: 'Food not found' });
        }
        res.status(200).json(food);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getRandomFood(req, res) {
    const code = req.params.code
    try {
        let randomFoodList = []
        // check if code is provided in the params
        if (code) {
            randomFoodList = await Food.aggregate([
                { $match: { code } },
                { $sample: { size: 6 } }
            ])
        }

        //if no code provided matches

        if (!randomFoodList.length) {
            randomFoodList = await Food.aggregate([
                { $sample: { size: 3 } }
            ])
        }

        //respond ith the result

        if (randomFoodList.length) {
            res.status(200).json(randomFoodList)
        } else {
            res.status(404).json({ status: false, message: "No food found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


// Restaurant Menu
async function getFoodsByRestaurant(req, res) {
    const id = req.params.id
    try {
        const foods = await Food.find({ restaurant: id });
        res.status(200).json(foods);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


async function getFoodByCategoryAndCode(req, res) {
    const { category, code } = req.params;

    try {
        const foods = await Food.aggregate([
            { $match: { category: category, code: code } },

        ]);
        if (foods.length === 0) {
            console.log()
            res.status(200).json([]);
        } else {
            res.status(200).json(foods)
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getallFoodsByCodee(req, res) {
    const code = req.params.code;
    try {
        const foodList = await Food.find({ code: code });
        return res.status(200).json(foodList)
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message })
    }

}

async function searchFoodAndRestaurant(req, res) {
    const search = req.params.search;

    try {
        // Search in Food collection
        const foodResults = await Food.aggregate([
            {
                $search: {
                    index: "foods",
                    text: {
                        query: search,
                        path: {
                            wildcard: "*"
                        }
                    }
                }
            }
        ]);

        // Search in Restaurant collection
        const restaurantResults = await Restaurant.aggregate([
            {
                $search: {
                    index: "restaurants",
                    text: {
                        query: search,
                        path: {
                            wildcard: "*"
                        }
                    }
                }
            }
        ]);

        // Combine the results
        const results = {
            foods: foodResults,
            restaurants: restaurantResults
        };

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}


async function searchFood(req, res) {
    const search = req.params.search;

    try {
        const results = await Food.aggregate([
            {
                $search: {
                    index: "foods",
                    text: {
                        query: search,
                        path: {
                            wildcard: "*"
                        }
                    }
                }
            }
        ])

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getRandomFoodByCodeAndCategory(req, res) {
    const { category, code } = req.params;
    try {
        let foods;
        foods = await Food.aggregate([
            { $match: { category, code } },
            { $sample: { size: 3 } }
        ])

        if (foods.length === 0) {
            foods = await Food.aggregate([
                { $match: { code } },
                { $sample: { size: 3 } }
            ]);
        }
        if (foods.length === 0) {
            foods = await Food.aggregate([
                { $match: { isAvailable: true } },
                { $sample: { size: 3 } }
            ]);
        }
        res.status(200).json(food);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}




const getFoodByCategory = async (req, res) => {
    const { restaurantId, category } = req.params;

    try {
        // Find foods matching the restaurantId and category
        const foodList = await Food.aggregate([
            {
                $match: {
                    restaurant: new mongoose.Types.ObjectId(restaurantId),
                    restaurant_category: category
                }
            },
            { $sample: { size: 50 } } // Sample 6 foods; adjust as needed
        ]);

        // Respond with the result
        if (foodList.length) {
            res.status(200).json(foodList);
        } else {
            res.status(404).json({ status: false, message: "No food found for this restaurant and category" });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

async function searchRestaurantFood(req, res) {
    const { restaurantCategory, title, restaurant } = req.query;

    // Convert restaurant to ObjectId if it's a string representation
    const restaurantId = mongoose.Types.ObjectId.isValid(restaurant) ? new mongoose.Types.ObjectId(restaurant) : null;

    if (!restaurantId) {
        return res.status(400).json({ status: false, message: "Invalid restaurant ID" });
    }

    try {
        // Build the match criteria
        const matchCriteria = { restaurant: restaurantId };

        if (restaurantCategory) {
            matchCriteria.restaurant_category = restaurantCategory;
        }
        if (title) {
            matchCriteria.title = { $regex: title, $options: 'i' }; // Case-insensitive search
        }

        // Fetch data
        const foodList = await Food.find(matchCriteria).lean().exec();

        if (foodList.length > 0) {
            res.status(200).json(foodList);
        } else {
            res.status(404).json({ status: false, message: "No food found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function fetchRestaurantCategories(req, res) {
    const { restaurantId } = req.params;

    try {
        // Convert restaurantId to ObjectId
        // const objectId = mongoose.Types.ObjectId(restaurantId);

        // Find distinct restaurant categories for the restaurant
        const categories = await Food.find({ restaurant: restaurantId }).distinct('restaurant_category');

        // Return the categories as a response
        return res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching restaurant categories: ", error);

        // Return an error response
        return res.status(500).json({ message: "Server error", error });
    }
}

async function fetchFoodByCategory(req, res) {
    const { category } = req.params;
    console.log('Category ID:', category);

    try {
        // Find foods by category
        const foods = await Food.find({ category });

        if (!foods.length) {
            return res.status(200).json([]); // Return empty array if no foods found
        }

        // Manually include the __v field in each document
        const foodsWithVersion = foods.map(food => {
            const foodObj = food.toObject(); // Convert Mongoose document to plain object
            foodObj.__v = food.__v; // Manually add __v back to the object
            return foodObj;
        });

        return res.status(200).json(foodsWithVersion); // Return foods including __v
    } catch (error) {
        console.error('Error fetching foods by category:', error);
        return res.status(500).json({ message: 'Error fetching foods by category.', error: error.message });
    }
}









module.exports = { addFood, fetchRestaurantCategories, getFoodById, getRandomFood, getFoodByCategoryAndCode, getFoodsByRestaurant, getallFoodsByCodee, searchFood, getRandomFoodByCodeAndCategory, getFoodByCategory, searchRestaurantFood, searchFoodAndRestaurant, fetchFoodByCategory }