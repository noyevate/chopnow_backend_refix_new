const Category = require("../models/Category");
const mongoose = require('mongoose');
const Rider = require("../models/Rider");

async function createCategory(req, res) {
    const newCategory = new Category(req.body)
    try {
        await newCategory.save()
        res.status(201).json({ status: true, message: "Category Created Successfully" })
    } catch (error) {
        res.status(500).json({ status: false, message: error.message })
    }
}

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.aggregate([{ $sample: { size: await Category.countDocuments() } }]);
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
};

async function getRandomCategories(req, res) {
    try {
        let categories = await Category.aggregate([
            { $match: { value: { $ne: "more" } } },
            { $sample: { size: 6 } }
            ,]);
        const moreCategory = await Category.findOne({ value: "more" });
        if (moreCategory) {
            categories.push(moreCategory)
        }
        res.status(200).json(categories)

    } catch (error) {
        res.status(500).json({ status: false, message: error.message })
    }
}

async function updateCategoryImage(req, res) {
    const { categoryId } = req.params;
    let { imageUrl } = req.body;

    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }


        category.imageUrl = imageUrl;
        await category.save();

        res.status(200).json({
            status: true,
            message: "User image updated successfully",
            imageUrl: category.imageUrl // Return a properly formatted URL
        });

    } catch (error) {

    }
       
}

module.exports = { createCategory, getAllCategories, getRandomCategories, updateCategoryImage };
