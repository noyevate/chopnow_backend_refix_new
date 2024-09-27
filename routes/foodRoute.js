const router = require('express').Router();
const foodController = require('../controllers/foodControllers');
const {verifyVendor} = require('../middlewares/verifyToken');

router.post("/", foodController.addFood);
router.get('/foods-by-category/:restaurantId/:category', foodController.getFoodByCategory);
router.get('/search-restaurant-food', foodController.searchRestaurantFood)
router.get("/:id",foodController.getFoodById);
router.get("/restaurant-food/:id", foodController.getFoodsByRestaurant);
router.get("/random/:code", foodController.getRandomFood);
router.get("/search/:search", foodController.searchFood);
router.get("/search-food-restaurant/:search", foodController.searchFoodAndRestaurant);
router.get("/:category/:code", foodController.getFoodByCategoryAndCode);
router.get('/categoriesList/:id', foodController.fetchRestaurantCategories);


router.get("/ByCode/:code", foodController.getallFoodsByCodee);


module.exports = router;