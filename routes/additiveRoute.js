const router = require('express').Router();
const additiveController = require('../controllers/additiveController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", additiveController.addAdditive);
router.get("/:id", additiveController.getAdditivesById);
router.patch('/additives/:additiveId', additiveController.editAdditive);
router.patch('/additives/:additiveId/:optionId', additiveController.updateOptionInAdditive);
router.patch('/additives/isAvailable/:additiveId/:availability', additiveController.updateAdditiveAvailability);
router.delete('/additives/:additiveId', additiveController.deleteAdditive);
router.delete('/additives/removeAdditive/:additiveId/:optionId', additiveController.deleteOptionFromAdditive);


module.exports = router; 