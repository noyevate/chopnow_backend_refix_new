const router = require('express').Router();
const ratingController = require('../controllers/ratingController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken');

router.post("/", verifyTokenAndAuthorization, ratingController.addRating);
router.get("/", ratingController.getRestaurantRatings);
// router.get("/", ratingController.checkUserRating); // This route is not needed in this context, but I'll keep it commented out.

module.exports = router;
