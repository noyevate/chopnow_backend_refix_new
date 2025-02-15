const router = require('express').Router();
const riderRatingController = require('../controllers/riderRatingController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/",  riderRatingController.rateRider);
router.get('/ratings/:riderId', getRatingsByRider);
router.get('/rating/:orderId/:riderId', riderRatingController.getRatingByOrderAndRider);




module.exports = router;