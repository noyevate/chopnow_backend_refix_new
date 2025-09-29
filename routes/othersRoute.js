const router = require('express').Router();
const othersController = require('../controllers/otherController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", othersController.CreateOthers);
router.get("/", othersController.getLocation)
router.patch("/location", othersController.updateLocation)

module.exports = router;