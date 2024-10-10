const router = require('express').Router();
const additiveController = require('../controllers/additiveController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", additiveController.addAdditive);
router.get("/:id", additiveController.getAdditivesById);

module.exports = router; 