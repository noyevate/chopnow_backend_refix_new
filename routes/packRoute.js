const router = require('express').Router();
const packController = require('../controllers/packController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", packController.addPack);
router.get("/:id", packController.getPacks);
router.get("/getPacksById/:id", packController.getPacksById);
router.patch("/update/:id", packController.updatePack);
router.delete('/delete/:id', packController.deletePack);


module.exports = router;