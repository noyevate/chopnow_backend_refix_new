const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
//const {verifyVendor} = require('../middleware/verifyToken');

router.post("/", categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.get("/random", categoryController.getRandomCategories);
router.patch("/update/:categoryId", categoryController.updateCategoryImage);

module.exports = router;