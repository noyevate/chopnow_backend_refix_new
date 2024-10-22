const router = require('express').Router();
const additiveController = require('../controllers/additiveController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", additiveController.addAdditive);
router.get("/:id", additiveController.getAdditivesById);
router.patch('/additives/:additiveId', additiveController.editAdditive);


module.exports = router; 