const router = require('express').Router();
const foodController = require('../controllers/foodControllers');
const {verifyVendor} = require('../middlewares/verifyToken');

router.post("/", foodController.addFood);
router.get('/foods-by-category/:restaurantId/:category', foodController.getFoodByCategory);
router.get('/categoriesList/:restaurantId', foodController.fetchRestaurantCategories);
router.get("/additive/:restaurantId", foodController.fetchRestaurantAdditives);
router.get('/search-restaurant-food', foodController.searchRestaurantFood)
router.get("/:id",foodController.getFoodById);
router.get("/restaurant-food/:restaurantId", foodController.filteredFoodByRestaurantCategory);
router.get("/random/:code", foodController.getRandomFood);
router.get("/search/:search", foodController.searchFood);
router.get("/search-food-restaurant/:search", foodController.searchFoodAndRestaurant);
router.get("/:category/:code", foodController.getFoodByCategoryAndCode);
router.get("/ByCode/:code", foodController.getallFoodsByCodee);
router.get("/category/list/:category", foodController.fetchFoodByCategory);
router.put("/categoryAvailability/:restaurantId/:restaurant_category", foodController.restaurantCategoryAvailability);
router.patch("/update-category/:restaurantId/:currentCategory/:newCategory", foodController.updateRestaurantCategory);
router.get("/fetch-single-food-additive/:foodId/additives", foodController.fetchAdditivesForSingleFood);
router.get("/fetch-single-food-packs/:foodId/packs", foodController.fetchPackForSingleFood);

// router.get("/restaurant-food/:id", foodController.getFoodsByRestaurant);



module.exports = router;