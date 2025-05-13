const router = require('express').Router();
const restaurantController = require('../controllers/restaurantController');
const {verifyVendor} = require('../middlewares/verifyToken');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", verifyVendor, restaurantController.addRestaurant);
router.get('/popular', restaurantController.getPopularRestaurant);
router.post('/account_details', verifyVendor, restaurantController.addRestuarantAccountDetails);
router.get("/:code",  restaurantController.getRandomRestaurant);
router.get("/all/:code", restaurantController.getAllNearbyRestaurant);
router.get("/byId/:id", restaurantController.getRestaurantById);
router.get("/byUserId/:userId", restaurantController.getRestaurantByUser);
router.get("/", restaurantController.getRestaurantbyUserId);
router.post('/toggle-availability/:id', verifyVendor, restaurantController.restaurantAvailability);
router.post("/addTime/:id", verifyVendor, restaurantController.addTimeToRestaurant);
router.put('/updateRestaurant/:restaurantId', verifyVendor, restaurantController.updatedRestaurant);

module.exports = router;