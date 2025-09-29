// const Food = require("../models/Food");
// const Restaurant = require("../models/restaurant");
// const Additives = require('../models/Additive');
// const Packs = require('../models/Pack');
// const mongoose = require('mongoose');

const { Food, Restaurant, Additive, Pack } = require("../models"); 
const sequelize = require('../config/database');
const { Op } = require("sequelize");


// In controllers/foodController.js
async function addFood(req, res) {
    // 1. Destructure ONLY the fields you expect and need from the request body.
    const {
        title,
        time,
        foodTags,
        categoryId,
        foodType,
        code,
        isAvailable,
        restaurantId,
        rating,
        ratingCount,
        description,
        price,
        priceDescription,
        additive,
        pack,
        imageUrl,
        restaurant_category
    } = req.body;

    // 2. Validate the required fields.
    if (!title || !restaurantId || !categoryId) {
        return res.status(400).json({ status: false, message: "Title, Restaurant ID, and Category ID are required." });
    }

    try {
        const result = await sequelize.transaction(async (t) => {
            // 3. Build a clean data object with only the allowed fields.
            // This prevents any unwanted fields (like 'userId') from being passed to .create()
            const foodData = {
                title,
                time,
                foodTags,
                categoryId,
                foodType,
                code,
                isAvailable,
                restaurantId,
                rating,
                ratingCount,
                description,
                price,
                priceDescription,
                additive,
                pack,
                imageUrl,
                restaurant_category
            };

            const newFood = await Food.create(foodData, { transaction: t });
            
            // --- Logic to update the restaurant (remains the same) ---
            const restaurantDoc = await Restaurant.findByPk(restaurantId, { transaction: t });
            if (restaurantDoc) {
                let categories = restaurantDoc.restaurant_categories || [];
                const categoryIndex = categories.findIndex(cat => cat.name === restaurant_category);
                if (categoryIndex === -1) {
                    categories.push({ name: restaurant_category, additives: additive });
                } else {
                    const existingAdditives = new Set(categories[categoryIndex].additives);
                    additive.forEach(add => existingAdditives.add(add));
                    categories[categoryIndex].additives = Array.from(existingAdditives);
                }
                await restaurantDoc.update({ restaurant_categories: categories }, { transaction: t });
            }
            // --- End restaurant update logic ---

            return newFood;
        });

        res.status(201).json({ status: true, message: "Food has been added successfully", food: result });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to add food.", error: error.message });
    }
}

async function getFoodById(req, res) {
    const { id } = req.params;
    try {
        // Sequelize: .findByPk is the direct equivalent of .findById
        const food = await Food.findByPk(id);
        
        if (!food) {
            return res.status(404).json({ status: false, message: 'Food not found' });
        }
        res.status(200).json(food);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get food.", error: error.message });
    }
}

async function getRandomFood(req, res) {
    const { code } = req.params;
    try {
        let randomFoodList = [];
        
        if (code) {
            // Find random food items matching the code
            randomFoodList = await Food.findAll({
                where: { code: code },
                order: sequelize.random(),
                limit: 6
            });
        }

        // If the first search yielded no results (or no code was provided), run the fallback
        if (randomFoodList.length === 0) {
            randomFoodList = await Food.findAll({
                order: sequelize.random(),
                limit: 3
            });
        }

        if (randomFoodList.length > 0) {
            res.status(200).json(randomFoodList);
        } else {
            res.status(404).json({ status: false, message: "No food found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get random food.", error: error.message });
    }
}


// Restaurant Menu

async function getFoodsByRestaurant(req, res) {
    const { id } = req.params; // This is the restaurantId
    try {
        // Sequelize: .findAll({ where: ... }) is the equivalent of .find({ ... })
        const foods = await Food.findAll({
            where: { restaurantId: id }
        });
        
        // It's standard to return an empty array if no foods are found.
        res.status(200).json(foods);

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get restaurant foods.", error: error.message });
    }
}


async function getFoodByCategoryAndCode(req, res) {
    const { category, code } = req.params;

    try {
        const foods = await Food.findAll({
            where: {
                categoryId: category, // Use the correct foreign key name
                code: code
            }
        });

        
        res.status(200).json(foods);
        
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get food by category/code.", error: error.message });
    }
}

async function getAllFoodsByCode(req, res) { // Renamed for clarity
    const { code } = req.params;
    try {
        const foodList = await Food.findAll({
            where: { code: code }
        });
        
        return res.status(200).json(foodList);

    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to get all foods by code.", error: error.message });
    }
}

async function searchFoodAndRestaurant(req, res) {
    const { search } = req.params;

    try {
        // Search for foods where the title is LIKE the search term
        const foodResults = await Food.findAll({
            where: {
                title: {
                    [Op.like]: `%${search}%` // Corresponds to: LIKE '%search_term%'
                }
            },
            limit: 10 // It's a good practice to limit search results
        });

        // Search for restaurants where the title is LIKE the search term
        const restaurantResults = await Restaurant.findAll({
            where: {
                title: {
                    [Op.like]: `%${search}%`
                }
            },
            limit: 10
        });

        // Combine the results
        const results = {
            foods: foodResults,
            restaurants: restaurantResults
        };

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ status: false, message: "Search failed.", error: error.message });
    }
}


async function searchFood(req, res) {
    const { search } = req.params;

    try {
        const results = await Food.findAll({
            where: {
                title: {
                    [Op.like]: `%${search}%`
                }
            },
            limit: 20 // Limit the results
        });

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ status: false, message: "Food search failed.", error: error.message });
    }
}

async function getRandomFoodByCodeAndCategory(req, res) {
    const { category, code } = req.params;
    try {
        let foods = [];

        // 1. First, try to find by both categoryId and code
        if (category && code) {
            foods = await Food.findAll({
                where: { categoryId: category, code: code },
                order: sequelize.random(),
                limit: 3
            });
        }

        // 2. If nothing was found, fall back to searching by code only
        if (foods.length === 0 && code) {
            foods = await Food.findAll({
                where: { code: code },
                order: sequelize.random(),
                limit: 3
            });
        }
        
        // 3. If still nothing was found, fall back to any available food
        if (foods.length === 0) {
            foods = await Food.findAll({
                where: { isAvailable: true },
                order: sequelize.random(),
                limit: 3
            });
        }
        
        // Your original code had a typo here, returning 'food' instead of 'foods'
        res.status(200).json(foods);

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get random food.", error: error.message });
    }
}


const getFoodByCategory = async (req, res) => {
    const { restaurantId, category } = req.params;

    try {
        const foodList = await Food.findAll({
            where: {
                restaurantId: restaurantId,
                restaurant_category: category // This is the string category defined by the restaurant
            },
            order: sequelize.random(),
            limit: 50
        });

        if (foodList.length > 0) {
            res.status(200).json(foodList);
        } else {
            res.status(404).json({ status: false, message: "No food found for this restaurant and category" });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get food by category.", error: error.message });
    }
};



async function searchRestaurantFood(req, res) {
    // This function now uses req.params, but query params are more flexible for search.
    // Sticking to your structure for now.
    const { restaurantCategory, title, restaurant } = req.query;

    if (!restaurant) {
        return res.status(400).json({ status: false, message: "Restaurant ID is required." });
    }

    try {
        // Build the where clause dynamically
        const whereClause = { restaurantId: restaurant };

        if (restaurantCategory) {
            whereClause.restaurant_category = restaurantCategory;
        }
        if (title) {
            whereClause.title = { [Op.like]: `%${title}%` }; // Case-insensitive by default in MySQL
        }

        const foodList = await Food.findAll({ where: whereClause });

        if (foodList.length > 0) {
            res.status(200).json(foodList);
        } else {
            // It's often better to return an empty array for a search
            res.status(200).json([]);
        }
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to search for food.", error: error.message });
    }
}


async function fetchRestaurantCategories(req, res) {
    const { restaurantId } = req.params;

    try {
        const categories = await Food.findAll({
            where: { restaurantId: restaurantId },
            attributes: ['restaurant_category'], // Select only the category field
            group: ['restaurant_category']       // Group by it to get unique values
        });

        // The result is an array of objects, e.g., [{ restaurant_category: 'Pizza' }, ...].
        // We map it to a simple array of strings to match the original Mongoose output.
        const categoryNames = categories.map(c => c.restaurant_category);

        return res.status(200).json(categoryNames);
    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to fetch restaurant categories.", error: error.message });
    }
}

async function fetchFoodByCategory(req, res) {
    const { category } = req.params; // This is now the categoryId

    try {
        const foods = await Food.findAll({
            where: { categoryId: category } // Use the correct foreign key name
        });

        // Sequelize models are clean JSON when sent in a response, no __v or .toObject() needed.
        return res.status(200).json(foods);

    } catch (error) {
        return res.status(500).json({ status: false, message: 'Error fetching foods by category.', error: error.message });
    }
}


async function fetchRestaurantAdditives(req, res) {
    const { restaurantId } = req.params;

    try {
        // 1. Fetch all food items for the restaurant, selecting only the 'additive' field for efficiency.
        const foods = await Food.findAll({
            where: { restaurantId: restaurantId },
            attributes: ['additive']
        });

        // 2. Process the results in JavaScript to get a unique list.
        const allAdditives = new Set(); // Use a Set for automatic de-duplication

        foods.forEach(food => {
            if (food.additive && Array.isArray(food.additive)) {
                food.additive.forEach(additive => {
                    // You might need to decide what makes an additive unique.
                    // If it's an object, stringifying is a simple way.
                    allAdditives.add(JSON.stringify(additive));
                });
            }
        });

        // 3. Convert the Set of strings back into an array of objects.
        const uniqueAdditives = Array.from(allAdditives).map(item => JSON.parse(item));

        return res.status(200).json(uniqueAdditives);
    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to fetch restaurant additives.", error: error.message });
    }
}






// async function filteredFoodByRestaurantCategory(req, res) {
//     const { restaurantId } = req.params;
//     console.log("Received restaurantId:", restaurantId); // Debugging line


//     // Validate the restaurantId format
//     if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
//         return res.status(400).json({ message: "Invalid restaurant ID format." });
//     }

//     try {
//         const foods = await Food.aggregate([
//             // Match by restaurant ID
//             { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },

//             // Group by restaurant_category and restaurantCategoryAvailable
//             {

//                 $group: {
//                     _id: {
//                         restaurant_category: "$restaurant_category",
//                         restaurantCategoryAvailable: "$restaurantCategoryAvailable"
//                     },
//                     items: {
//                         $push: {
//                             _id: "$_id",
//                             title: "$title",
//                             time: "$time",
//                             foodTags: "$foodTags",
//                             category: "$category",
//                             foodType: "$foodType",
//                             code: "$code",
//                             isAvailable: "$isAvailable",
//                             restaurant: "$restaurant",
//                             rating: "$rating",
//                             ratingCount: "$ratingCount",
//                             description: "$description",
//                             price: "$price",
//                             priceDescription: "$priceDescription",
//                             additive: "$additive",
//                             pack: "$pack",
//                             imageUrl: "$imageUrl"
//                         }
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,  // Exclude the default _id field generated by MongoDB
//                     restaurant_category: "$_id.restaurant_category",
//                     restaurantCategoryAvailable: "$_id.restaurantCategoryAvailable",
//                     items: 1
//                 }
//             }
//         ]);

//         // Send the formatted response
//         res.status(200).json(foods);
//     } catch (error) {
//         console.error("Error fetching food by restaurant and category:", error);
//         res.status(500).json({ message: "An error occurred while fetching food data." });
//     }
// }


async function filteredFoodByRestaurantCategory(req, res) {
    const { restaurantId } = req.params;

    try {
        // Step 1: Fetch all food items for the given restaurant.
        const foods = await Food.findAll({
            where: { restaurantId: restaurantId }
        });

        // Step 2: Group the results in JavaScript using .reduce()
        const groupedByCategory = foods.reduce((acc, food) => {
            // Create a unique key for each group
            const key = food.restaurant_category;
            
            // If this is the first time we see this category, create the group
            if (!acc[key]) {
                acc[key] = {
                    restaurant_category: food.restaurant_category,
                    restaurantCategoryAvailable: food.restaurantCategoryAvailable,
                    items: []
                };
            }
            
            // Push the current food item into its group
            acc[key].items.push(food);
            
            return acc;
        }, {});

        // Step 3: Convert the grouped object back into an array
        const result = Object.values(groupedByCategory);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching food by restaurant and category:", error);
        res.status(500).json({ status: false, message: "An error occurred while fetching food data.", error: error.message });
    }
}


async function restaurantCategoryAvailability(req, res) {
    const { restaurantId, restaurant_category } = req.params;

    try {
        // Step 1: Find a single food item to determine the *current* availability
        const foodItem = await Food.findOne({
            where: {
                restaurantId: restaurantId,
                restaurant_category: restaurant_category
            }
        });

        if (!foodItem) {
            return res.status(404).json({
                status: false,
                message: "No food items found for the specified restaurant and category."
            });
        }

        // Step 2: Toggle the value
        const newAvailabilityStatus = !foodItem.restaurantCategoryAvailable;

        // Step 3: Update all food items that match the criteria
        const [modifiedCount] = await Food.update(
            { restaurantCategoryAvailable: newAvailabilityStatus },
            {
                where: {
                    restaurantId: restaurantId,
                    restaurant_category: restaurant_category
                }
            }
        );

        res.status(200).json({
            status: true,
            message: `Successfully updated availability for category: ${restaurant_category}`,
            newAvailabilityStatus: newAvailabilityStatus,
            modifiedCount: modifiedCount
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "An error occurred while updating category availability.", error: error.message });
    }
};



async function updateRestaurantCategory(req, res) {
    const { restaurantId, currentCategory, newCategory } = req.params;

    try {
        const [modifiedCount] = await Food.update(
            { restaurant_category: newCategory }, // The new value to set
            {
                where: {
                    restaurantId: restaurantId,
                    restaurant_category: currentCategory
                }
            }
        );
        
        if (modifiedCount === 0) {
            return res.status(404).json({ status: false, message: "No matching food items found to update." });
        }

        res.status(200).json({
            success: true,
            message: `${modifiedCount} food items updated to new restaurant category.`
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update restaurant category.", error: error.message });
    }
}


// Fetch food additives

// In controllers/foodController.js

async function fetchAdditivesForSingleFood(req, res) {
    const { foodId } = req.params;
    console.log(`--- 1. Received request for foodId: ${foodId} ---`);
    try {
        const food = await Food.findByPk(foodId);

        if (!food) {
            console.log("--- 2. Food not found in database. ---");
            return res.status(404).json({ status: false, message: "Food not found." });
        }
        
        console.log("--- 2. Found food. Checking 'additive' field... ---");
        // Log the exact content of the additive field as a string
        console.log("food.additive:", JSON.stringify(food.additive, null, 2));

        if (!food.additive || !Array.isArray(food.additive) || food.additive.length === 0) {
            console.log("--- 3. 'additive' field is empty or not an array. Returning []. ---");
            return res.status(200).json([]);
        }

        const additiveIds = food.additive.map(add => add.id);
        
        console.log(`--- 3. Extracted these IDs from the JSON: [${additiveIds.join(', ')}] ---`);

        const resolvedAdditives = await Additive.findAll({
            where: {
                id: { [Op.in]: additiveIds }
            }
        });
        
        console.log(`--- 4. Final query found ${resolvedAdditives.length} matching additives. ---`);

        res.status(200).json(resolvedAdditives);
    } catch (error) {
        console.error("--- !!! ERROR in fetchAdditivesForSingleFood !!! ---", error);
        res.status(500).json({ status: false, message: "Failed to fetch additives.", error: error.message });
    }
}

// frt single pack

async function fetchPackForSingleFood(req, res) {
    const { foodId } = req.params;

    try {
        const food = await Food.findByPk(foodId);
        console.log( `Foooooooooood ${foodId}  ${food}`)

        if (!food || !food.pack || food.pack.length === 0) {
            return res.status(200).json({status: false, message: "No food pack found"}); // Return empty array if no food or packs
        }

        // The 'pack' field is a JSON array of objects with IDs
        const packIds = food.pack.map(p => p.id);
        console.log( `packIds ${packIds}`)
        

        // Fetch all Pack documents that match the extracted IDs
        const resolvedPacks = await Pack.findAll({
            where: {
                id: {
                    [Op.in]: packIds
                }
            }
        });

        res.status(200).json(resolvedPacks);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to fetch packs.", error: error.message });
    }
}




module.exports = {
    addFood,
    fetchRestaurantCategories,
    getFoodById,
    getRandomFood,
    getFoodByCategoryAndCode,
    getFoodsByRestaurant,
    getAllFoodsByCode,
    searchFood,
    getRandomFoodByCodeAndCategory,
    getFoodByCategory,
    searchRestaurantFood,
    searchFoodAndRestaurant,
    fetchFoodByCategory,
    fetchRestaurantAdditives,
    filteredFoodByRestaurantCategory,
    restaurantCategoryAvailability,
    updateRestaurantCategory,
    fetchAdditivesForSingleFood,
    fetchPackForSingleFood

}




