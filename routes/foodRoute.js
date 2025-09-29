// const router = require('express').Router();
// const foodController = require('../controllers/foodControllers');
// const {verifyVendor} = require('../middlewares/verifyToken');

// router.post("/", verifyVendor, foodController.addFood);
// router.get('/foods-by-category/:restaurantId/:category', foodController.getFoodByCategory);
// router.get('/categoriesList/:restaurantId', foodController.fetchRestaurantCategories);
// router.get("/additive/:restaurantId", foodController.fetchRestaurantAdditives);
// router.get('/search-restaurant-food', foodController.searchRestaurantFood)
// router.get("/:id",foodController.getFoodById);
// router.get("/restaurant-food/:restaurantId", foodController.filteredFoodByRestaurantCategory);
// router.get("/random/:code", foodController.getRandomFood);
// router.get("/search/:search", foodController.searchFood);
// router.get("/search-food-restaurant/:search", foodController.searchFoodAndRestaurant);
// router.get("/:category/:code", foodController.getFoodByCategoryAndCode);
// router.get("/ByCode/:code", foodController.getallFoodsByCodee);
// router.get("/category/list/:category", foodController.fetchFoodByCategory);
// router.put("/categoryAvailability/:restaurantId/:restaurant_category", foodController.restaurantCategoryAvailability);
// router.patch("/update-category/:restaurantId/:currentCategory/:newCategory", foodController.updateRestaurantCategory);
// router.get("/fetch-single-food-additive/:foodId/additives", foodController.fetchAdditivesForSingleFood);
// router.get("/fetch-single-food-packs/:foodId/packs", foodController.fetchPackForSingleFood);

// // router.get("/restaurant-food/:id", foodController.getFoodsByRestaurant);



// module.exports = router;


// routes/foodRoute.js
const router = require('express').Router();
// Correct the filename to match what you have, likely 'foodController' (singular)
const foodController = require('../controllers/foodControllers');
const { verifyVendor } = require('../middlewares/verifyToken');

router.post("/", verifyVendor, foodController.addFood);

router.get("/restaurant-food/:id", foodController.getFoodsByRestaurant);

router.get('/foods-by-category/:restaurantId/:category', foodController.getFoodByCategory);

router.get('/by-category/:restaurantId/:category', foodController.getFoodByCategory);

router.get('/restaurant-categories/:restaurantId', foodController.fetchRestaurantCategories);

router.get("/restaurant-additives/:restaurantId", foodController.fetchRestaurantAdditives);


router.get('/search', foodController.searchRestaurantFood);


router.get("/:id", foodController.getFoodById);

router.get("/restaurant-menu/:restaurantId", foodController.filteredFoodByRestaurantCategory);

router.get("/random/:code?", foodController.getRandomFood);

// This route must be deleted or commented out.
router.get("/search/:search", foodController.searchFood);

// This route must be deleted or commented out.
router.get("/search-food-restaurant/:search", foodController.searchFoodAndRestaurant);

// ✅ GET /api/food/:category/:code
// This route is CORRECT. 'getFoodByCategoryAndCode' exists.
router.get("by-category-and-code/:category/:code", foodController.getFoodByCategoryAndCode);

// ✅ GET /api/food/by-code/:code
// The function was renamed from 'getallFoodsByCodee' to 'getAllFoodsByCode'.
router.get("/by-code/:code", foodController.getAllFoodsByCode);

router.get("/category/list/:category", foodController.fetchFoodByCategory);

router.put("/category-availability/:restaurantId/:restaurant_category", foodController.restaurantCategoryAvailability);

router.patch("/update-category/:restaurantId/:currentCategory/:newCategory", foodController.updateRestaurantCategory);


router.get("/additives/:foodId", foodController.fetchAdditivesForSingleFood);

router.get("/packs/:foodId", foodController.fetchPackForSingleFood);




module.exports = router;