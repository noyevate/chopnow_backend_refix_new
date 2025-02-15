const router = require('express').Router();
const riderRatingController = require('../controllers/riderRatingController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/",  riderRatingController.rateRider);
router.delete("/",  riderRatingController.deleteRiderRating);
router.get('/ratings/:riderId', riderRatingController.getRatingsByRider);
router.get('/rating/:orderId/:riderId', riderRatingController.fetchRatingByOrderId);




module.exports = router;