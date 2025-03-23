const router = require('express').Router();
const riderRatingController = require('../controllers/riderRatingController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/rider-rating/:customerRating",  riderRatingController.rateRider);
router.delete("/rider-rating",  riderRatingController.deleteRiderRating);
router.get('/rider-rating/:riderId', riderRatingController.getRatingsByRider);
router.get('/rider-rating/:orderId/:riderId', riderRatingController.fetchRatingByOrderId);




module.exports = router;