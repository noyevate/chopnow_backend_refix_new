// controllers/categoryController.js
const {Category,} = require("../models"); // The new Sequelize model
const sequelize = require('../config/database'); // Import sequelize for random ordering

async function createCategory(req, res) {
    try {
        // .create() is the direct equivalent of new Model().save()
        const newCategory = await Category.create(req.body);
        res.status(201).json({ status: true, message: "Category Created Successfully", category: newCategory });
    } catch (error) {
        // Catches validation errors (e.g., a required field is missing)
        res.status(500).json({ status: false, message: "Failed to create category.", error: error.message });
    }
}

const getAllCategories = async (req, res) => {
    try {
        // To get a random order, we can use the database's random function.
        // This is more efficient than fetching all and shuffling in JS.
        const categories = await Category.findAll({
            order: sequelize.random() // Order the results randomly
        });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to fetch categories.", error: error.message });
    }
};

async function getRandomCategories(req, res) {
    try {
        // We need to import Op (Operators) for the 'not equal' condition
        const { Op } = require("sequelize");

        // 1. Get 7 random categories that are not the "more" category.
        // We fetch one extra to handle the case where the "more" category is randomly selected.
        let randomCategories = await Category.findAll({
            where: {
                value: {
                    [Op.ne]: "more" // value != 'more'
                }
            },
            order: sequelize.random(), // Order randomly
            limit: 7 // Get up to 7 random categories
        });

        // 2. Find the "more" category separately.
        const moreCategory = await Category.findOne({
            where: { value: "more" }
        });

        // 3. Ensure we only have 6 random categories, then add "more" if it exists.
        let finalCategories = randomCategories.slice(0, 6);
        if (moreCategory) {
            finalCategories.push(moreCategory);
        }

        res.status(200).json(finalCategories);

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to get random categories.", error: error.message });
    }
}

async function updateCategoryImage(req, res) {
    const { categoryId } = req.params;
    const { imageUrl } = req.body;

    try {
        if (!imageUrl) {
            return res.status(400).json({ status: false, message: "Image URL is required." });
        }
        
        // .update() is the Sequelize method for updating records.
        // It returns an array with the number of affected rows.
        const [updatedRows] = await Category.update({
            imageUrl: imageUrl
        }, {
            where: { id: categoryId }
        });

        if (updatedRows === 0) {
            return res.status(404).json({ status: false, message: "Category not found." });
        }
        
        // Fetch the updated category to return the new data
        const updatedCategory = await Category.findByPk(categoryId);
        res.status(200).json({
            status: true,
            message: "Category image updated successfully",
            category: updatedCategory
        });

    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to update image.", error: error.message });
    }
}

module.exports = { createCategory, getAllCategories, getRandomCategories, updateCategoryImage };