const router = require('express').Router();
const additiveController = require('../controllers/additiveController');
const {verifyTokenAndAuthorization} = require('../middlewares/verifyToken')

router.post("/", additiveController.addAdditive);

module.exports = router; 