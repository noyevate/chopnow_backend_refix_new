const router = require('express').Router();
const restaurantController = require('../controllers/restaurantController');
const {verifyVendor} = require('../middlewares/verifyToken');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", restaurantController.addRestaurant);
router.get('/popular', restaurantController.getPopularRestaurant);
router.get("/:code",  restaurantController.getRandomRestaurant);
router.get("/all/:code",  restaurantController.getAllNearbyRestaurant);
router.get("/byId/:id", restaurantController.getRestaurantById);
router.get("/byUserId/:userId", restaurantController.getRestaurantByUser);
router.get("/", restaurantController.getRestaurantbyUserId);
router.post('/toggle-availability/:id', restaurantController.restaurantAvailability);

module.exports = router;